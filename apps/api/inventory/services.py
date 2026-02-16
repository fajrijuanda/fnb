"""
Inventory Services Module
Business logic for stock management.

Following Service Layer Pattern:
- All business logic goes here (NOT in views.py)
- Views only handle request/response
"""
from django.db import transaction
from inventory.models import Ingredient, StockLog

@transaction.atomic
def deduct_stock_for_order(order) -> None:
    """
    Deduct stock after successful payment.
    Accepts an Order instance (which has related items).
    
    Handles two product types:
    - Barang Jadi (track_inventory=True): Deduct product.current_stock
    - Racikan/Composite (track_inventory=False): Deduct ingredients via recipe
    """
    for item in order.items.all():
        product = item.product
        qty_sold = item.quantity

        # Case A: Ready-to-sell Product (e.g., Canned Drink)
        if product.track_inventory:
            # Optional: Enforce stock check
            # if product.current_stock < qty_sold:
            #    raise ValidationError(f"Insufficient stock for {product.name}")
            
            product.current_stock -= qty_sold
            product.save()
            _log_stock_movement(product=product, qty=-qty_sold, reason='SALES', notes=f"Order {order.invoice_number}")

        # Case B: Composite/Recipe Product (e.g., Nasi Goreng)
        # Check if product has a recipe (OneToOne relation)
        elif hasattr(product, 'recipe'):
            recipe = product.recipe
            for recipe_item in recipe.items.all():
                ingredient = recipe_item.ingredient
                # Calculate total ingredient usage: required amount * quantity sold
                usage_amount = recipe_item.quantity_required * qty_sold
                
                ingredient.current_stock -= usage_amount
                ingredient.save()
                _log_stock_movement(
                    ingredient=ingredient, 
                    qty=-usage_amount, 
                    reason='SALES', 
                    notes=f"Order {order.invoice_number} (For {product.name})"
                )

        # Case C: Modifiers (Toppings)
        # Check modifiers_snapshot for any ingredients to deduct
        if item.modifiers_snapshot:
            from catalog.models import ModifierOption
            for mod_data in item.modifiers_snapshot:
                mod_id = mod_data.get('id')
                if mod_id:
                    try:
                        modifier = ModifierOption.objects.get(pk=mod_id)
                        if modifier.ingredient:
                            usage_qty = modifier.quantity_required * qty_sold
                            modifier.ingredient.current_stock -= usage_qty
                            modifier.ingredient.save()
                            _log_stock_movement(
                                ingredient=modifier.ingredient,
                                qty=-usage_qty,
                                reason='SALES',
                                notes=f"Order {order.invoice_number} (Modifier: {modifier.name})"
                            )
                    except ModifierOption.DoesNotExist:
                        pass # Modifier deleted, skip stock deduction


def _log_stock_movement(product=None, ingredient=None, qty=0, reason='SALES', notes="") -> None:
    """
    Internal helper to create stock movement log entry.
    """
    if not product and not ingredient:
        return

    # Determine final stock based on the object provided
    final_stock = 0
    if product:
        final_stock = product.current_stock
    elif ingredient:
        final_stock = ingredient.current_stock

    movement_type = 'OUT' if qty < 0 else 'IN'
    
    StockLog.objects.create(
        product=product,
        ingredient=ingredient,
        change_amount=qty,
        final_stock=final_stock,
        movement_type=movement_type,
        reason=reason,
        notes=notes,
        created_by="System" 
    )

def restock_ingredient(ingredient_id: int, quantity: float, notes: str = "") -> None:
    """Add stock to ingredient (restocking)."""
    with transaction.atomic():
        ingredient = Ingredient.objects.get(pk=ingredient_id)
        ingredient.current_stock += quantity
        ingredient.save()
        _log_stock_movement(
            ingredient=ingredient,
            qty=quantity,
            reason='PURCHASE',
            notes=notes
        )


class PaymentVerificationService:
    """
    AI-powered payment verification using Gemini Vision.
    Reads payment proof screenshots, extracts transaction details,
    and validates them against order data.
    """

    CONFIDENCE_THRESHOLD = 70  # Auto-approve if confidence >= 70%

    def __init__(self):
        from google import genai
        from django.conf import settings
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = 'gemini-2.0-flash'

    def create_payment(self, order):
        """Create a Payment record for a RestockOrder with 24h expiry."""
        from django.utils import timezone
        from datetime import timedelta
        from inventory.models import Payment

        payment = Payment.objects.create(
            order=order,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        return payment

    def verify_payment_proof(self, payment):
        """
        Analyze payment proof image using Gemini Vision AI.
        Returns: { verified: bool, confidence: int, details: dict, reason: str }
        """
        # AI Feature Disabled
        # Default to MANUAL_REVIEW so admin can check it manually.
        
        # from django.utils import timezone
        
        # Update payment record
        payment.verification_status = 'MANUAL_REVIEW'
        payment.verification_result = {'info': 'AI verification disabled'}
        payment.verification_confidence = 0
        payment.rejection_reason = 'Fitur AI dinonaktifkan. Menunggu verifikasi manual.'
        payment.save()

        return {
            'verified': False,
            'confidence': 0,
            'details': {'info': 'AI verification disabled'},
            'reason': 'Fitur AI dinonaktifkan. Menunggu verifikasi manual.',
            'status': 'MANUAL_REVIEW',
        }

    @staticmethod
    def cancel_expired_payments():
        """Cancel all expired unpaid payments and their orders."""
        from django.utils import timezone
        from inventory.models import Payment

        expired = Payment.objects.filter(
            expires_at__lt=timezone.now(),
            verification_status__in=('PENDING', 'REJECTED'),
        ).select_related('order')

        count = 0
        for payment in expired:
            payment.verification_status = 'EXPIRED'
            payment.save()
            order = payment.order
            if order.status == 'PENDING':
                order.status = 'CANCELLED'
                order.cancelled_at = timezone.now()
                order.save()
                count += 1
        return count


class ExternalOrderService:
    """
    Scaffold for samdenidimsum external API integration.
    Handles communication between OMDEN and HQ system.

    Configuration (in Django settings):
        EXTERNAL_HQ_API_URL = 'https://api.samdenidimsum.com/v1'
        EXTERNAL_HQ_API_KEY = 'your-api-key-here'
    """

    def __init__(self):
        from django.conf import settings
        self.base_url = getattr(settings, 'EXTERNAL_HQ_API_URL', '')
        self.api_key = getattr(settings, 'EXTERNAL_HQ_API_KEY', '')
        self.timeout = 30

    def _get_headers(self) -> dict:
        """Return auth headers for HQ API calls."""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

    def submit_order(self, order) -> dict:
        """
        POST order to external HQ system.
        Returns: { 'success': bool, 'external_id': str, 'message': str }
        """
        if not self.base_url:
            # API not configured yet — store locally only
            return {
                'success': True,
                'external_id': '',
                'message': 'External API not configured. Order saved locally.'
            }

        # TODO: Implement when samdenidimsum API is ready
        # import requests
        # payload = {
        #     'order_number': order.order_number,
        #     'items': [
        #         {
        #             'ingredient_name': item.ingredient.name,
        #             'quantity': float(item.quantity),
        #             'unit': item.unit,
        #         }
        #         for item in order.items.all()
        #     ],
        #     'shipping_address': order.shipping_address,
        #     'payment_method': order.payment_method,
        #     'notes': order.notes,
        # }
        # response = requests.post(
        #     f'{self.base_url}/orders/',
        #     json=payload,
        #     headers=self._get_headers(),
        #     timeout=self.timeout
        # )
        # data = response.json()
        # return {
        #     'success': response.ok,
        #     'external_id': data.get('id', ''),
        #     'message': data.get('message', ''),
        # }

        return {
            'success': True,
            'external_id': '',
            'message': 'External API not configured. Order saved locally.'
        }

    def get_hq_bank_details(self) -> dict:
        """
        GET HQ payment account details from external system.
        Returns bank info for Mitra to transfer to.
        """
        # Fallback: return from environment/settings
        from django.conf import settings
        return {
            'bank_name': getattr(settings, 'HQ_BANK_NAME', 'BCA'),
            'bank_account': getattr(settings, 'HQ_BANK_ACCOUNT', ''),
            'bank_holder': getattr(settings, 'HQ_BANK_HOLDER', 'PT Samdenidimsum'),
        }

