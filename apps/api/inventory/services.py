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


class PaymentVerificationService:
    """
    AI-powered payment verification using Gemini Vision.
    Reads payment proof screenshots, extracts transaction details,
    and validates them against order data.
    """

    CONFIDENCE_THRESHOLD = 70  # Auto-approve if confidence >= 70%

    def __init__(self):
        import google.generativeai as genai
        from django.conf import settings
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

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
        from django.utils import timezone
        from PIL import Image as PILImage
        from core.models import StoreSettings

        # Get HQ bank details for comparison
        store_settings = StoreSettings.objects.first()
        hq_bank_account = store_settings.bank_account if store_settings else ''
        hq_bank_name = store_settings.bank_name if store_settings else ''
        hq_bank_holder = store_settings.bank_holder if store_settings else ''

        order = payment.order
        expected_amount = float(order.total_amount)
        payment_method = order.get_payment_method_display()

        # Open the proof image for Gemini Vision
        try:
            img = PILImage.open(payment.payment_proof.path)
        except Exception as e:
            return {
                'verified': False,
                'confidence': 0,
                'details': {'error': str(e)},
                'reason': 'Gagal membuka gambar bukti pembayaran. Pastikan file adalah gambar yang valid.'
            }

        # Build the AI prompt
        prompt = f"""Kamu adalah sistem verifikasi pembayaran otomatis. Analisis screenshot bukti transfer/pembayaran berikut.

TUGAS: Ekstrak informasi dari gambar dan validasi terhadap data pesanan.

DATA PESANAN YANG HARUS DICOCOKKAN:
- Nominal yang harus dibayar: Rp {expected_amount:,.0f}
- Metode pembayaran: {payment_method}
- Rekening tujuan HQ: {hq_bank_name} - {hq_bank_account} a/n {hq_bank_holder}
- Kode pembayaran: {payment.payment_code}

INSTRUKSI:
1. Baca semua teks dalam gambar
2. Ekstrak: nominal transfer, rekening tujuan, nama penerima, tanggal transaksi, status transaksi
3. Cocokkan nominal dengan data pesanan (toleransi ±Rp 0)
4. Cocokkan rekening tujuan dengan data HQ
5. Pastikan status transaksi menunjukkan "berhasil"/"sukses"/"success"/"completed"

RESPOND DALAM FORMAT JSON SAJA (tanpa markdown code block):
{{
    "extracted_amount": <nominal yang terdeteksi dalam angka, 0 jika tidak terdeteksi>,
    "extracted_account": "<nomor rekening tujuan yang terdeteksi>",
    "extracted_recipient": "<nama penerima yang terdeteksi>",
    "extracted_date": "<tanggal transaksi yang terdeteksi>",
    "transaction_status": "<status transaksi: berhasil/gagal/pending/tidak_terdeteksi>",
    "amount_match": <true/false>,
    "account_match": <true/false>,
    "is_successful": <true apabila status transaksi berhasil>,
    "confidence": <0-100 tingkat keyakinan analisis>,
    "notes": "<catatan tambahan jika ada yang mencurigakan>"
}}"""

        try:
            response = self.model.generate_content([prompt, img])
            result_text = response.text.strip()

            # Clean markdown wrapping if present
            if result_text.startswith('```'):
                result_text = result_text.split('\n', 1)[1] if '\n' in result_text else result_text
                if result_text.endswith('```'):
                    result_text = result_text[:-3].strip()

            import json
            result = json.loads(result_text)
        except json.JSONDecodeError:
            return {
                'verified': False,
                'confidence': 0,
                'details': {'raw_response': response.text if 'response' in dir() else ''},
                'reason': 'AI tidak dapat menganalisis gambar. Pastikan bukti pembayaran jelas dan terbaca.'
            }
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'quota' in error_str.lower():
                return {
                    'verified': False,
                    'confidence': 0,
                    'details': {'error': 'rate_limit'},
                    'reason': 'Batas penggunaan AI tercapai. Coba lagi dalam beberapa menit.'
                }
            return {
                'verified': False,
                'confidence': 0,
                'details': {'error': error_str},
                'reason': f'Terjadi kesalahan saat verifikasi: {error_str}'
            }

        # Evaluate verification
        confidence = result.get('confidence', 0)
        amount_match = result.get('amount_match', False)
        account_match = result.get('account_match', False)
        is_successful = result.get('is_successful', False)

        all_pass = amount_match and account_match and is_successful
        verified = all_pass and confidence >= self.CONFIDENCE_THRESHOLD

        # Build rejection reason if not verified
        reason = ''
        if not verified:
            reasons = []
            if not amount_match:
                extracted = result.get('extracted_amount', 0)
                reasons.append(f'Nominal tidak cocok (terdeteksi: Rp {extracted:,.0f}, seharusnya: Rp {expected_amount:,.0f})')
            if not is_successful:
                reasons.append(f'Status transaksi: {result.get("transaction_status", "tidak terdeteksi")}')
            if not account_match:
                reasons.append('Rekening tujuan tidak cocok')
            if confidence < self.CONFIDENCE_THRESHOLD and all_pass:
                reasons.append(f'Tingkat keyakinan AI rendah ({confidence}%)')
            reason = '. '.join(reasons) if reasons else 'Verifikasi belum dapat dilakukan.'

        # Determine status
        if verified:
            status = 'VERIFIED'
        elif confidence < self.CONFIDENCE_THRESHOLD and all_pass:
            status = 'MANUAL_REVIEW'
        else:
            status = 'REJECTED'

        # Update payment record
        payment.verification_status = status
        payment.verification_result = result
        payment.verification_confidence = confidence
        payment.rejection_reason = reason
        if verified:
            payment.verified_at = timezone.now()
        payment.save()

        # Auto-advance order to PAID if verified
        if verified:
            order = payment.order
            order.status = 'PAID'
            order.paid_at = timezone.now()
            order.save()

        return {
            'verified': verified,
            'confidence': confidence,
            'details': result,
            'reason': reason,
            'status': status,
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

