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

