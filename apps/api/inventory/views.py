from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Ingredient, Recipe, StockLog, RestockOrder
from .serializers import (
    IngredientSerializer,
    RecipeSerializer,
    StockLogSerializer,
    RestockOrderSerializer,
)
from .services import restock_ingredient


class IngredientViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Ingredients (Raw Materials).
    Used by Admin Dashboard for inventory management.
    """
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by status
        stock_status = request.query_params.get('status')
        if stock_status:
            if stock_status.upper() == 'LOW':
                queryset = queryset.filter(current_stock__lte=models.F('min_stock_alert'), current_stock__gt=0)
            elif stock_status.upper() == 'CRITICAL':
                queryset = queryset.filter(current_stock__lte=0)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """
        Add stock to an ingredient.
        POST /api/v1/inventory/ingredients/{id}/restock/
        Body: { "quantity": 100, "notes": "Purchase from supplier" }
        """
        ingredient = self.get_object()
        quantity = request.data.get('quantity', 0)
        notes = request.data.get('notes', '')
        
        if quantity <= 0:
            return Response(
                {'status': 'error', 'message': 'Quantity must be positive.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restock_ingredient(ingredient.id, quantity, notes)
        ingredient.refresh_from_db()
        
        serializer = self.get_serializer(ingredient)
        return Response({
            'status': 'success',
            'message': f'Berhasil menambah {quantity} {ingredient.unit} {ingredient.name}.',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """
        Get all ingredients with low or critical stock levels.
        GET /api/v1/inventory/ingredients/low-stock/
        """
        # Get ingredients where current_stock <= min_stock_alert
        queryset = Ingredient.objects.filter(
            current_stock__lte=models.F('min_stock_alert')
        ).order_by('current_stock')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data
        })


class RecipeViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Recipes.
    Links Products to their Ingredients.
    """
    queryset = Recipe.objects.select_related('product').prefetch_related('items__ingredient').all()
    serializer_class = RecipeSerializer


class StockLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for Stock Logs.
    Used for audit trail and reporting.
    """
    queryset = StockLog.objects.select_related('ingredient', 'product').all()
    serializer_class = StockLogSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by ingredient
        ingredient_id = request.query_params.get('ingredient')
        if ingredient_id:
            queryset = queryset.filter(ingredient_id=ingredient_id)
        
        # Filter by movement type
        movement_type = request.query_params.get('type')
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type.upper())
        
        # Limit results
        limit = request.query_params.get('limit', 50)
        queryset = queryset[:int(limit)]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class RestockOrderViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Restock Orders.
    Mitra creates orders, status is updated by HQ or external system.
    """
    queryset = RestockOrder.objects.prefetch_related('items__ingredient').select_related('payment').all()
    serializer_class = RestockOrderSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Filter by status
        order_status = request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status.upper())

        # Filter active (non-terminal) vs history (terminal)
        view = request.query_params.get('view')
        if view == 'active':
            queryset = queryset.exclude(status__in=['RECEIVED', 'CANCELLED'])
        elif view == 'history':
            queryset = queryset.filter(status__in=['RECEIVED', 'CANCELLED'])

        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'status': 'success', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='upload-proof')
    def upload_proof(self, request, pk=None):
        """
        Upload payment proof and trigger AI verification.
        POST /api/v1/inventory/restock-orders/{id}/upload-proof/
        Body: multipart form with 'payment_proof' image file
        """
        order = self.get_object()

        if order.status != 'PENDING':
            return Response(
                {'status': 'error', 'message': 'Pesanan sudah dibayar atau dibatalkan.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or check payment exists
        try:
            payment = order.payment
        except Exception:
            return Response(
                {'status': 'error', 'message': 'Data pembayaran tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check expiry
        if payment.is_expired:
            payment.verification_status = 'EXPIRED'
            payment.save()
            order.status = 'CANCELLED'
            order.cancelled_at = timezone.now()
            order.save()
            return Response(
                {'status': 'error', 'message': 'Waktu pembayaran telah habis. Pesanan dibatalkan.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the uploaded file
        proof_file = request.FILES.get('payment_proof')
        if not proof_file:
            return Response(
                {'status': 'error', 'message': 'File bukti pembayaran wajib dikirim.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save proof and trigger AI verification
        payment.payment_proof = proof_file
        payment.payment_proof_uploaded_at = timezone.now()
        payment.verification_status = 'PROCESSING'
        payment.save()

        # Run AI verification
        from .services import PaymentVerificationService
        svc = PaymentVerificationService()
        result = svc.verify_payment_proof(payment)

        # Refresh order
        order.refresh_from_db()
        serializer = self.get_serializer(order)

        return Response({
            'status': 'success',
            'message': (
                'Pembayaran terverifikasi! ✅' if result['verified']
                else f'Verifikasi gagal: {result["reason"]}'
            ),
            'verification': result,
            'data': serializer.data,
        })

    @action(detail=True, methods=['get'], url_path='payment-info')
    def payment_info(self, request, pk=None):
        """
        Get payment instructions for an order.
        GET /api/v1/inventory/restock-orders/{id}/payment-info/
        Returns HQ bank details + payment code + expiry.
        """
        from core.models import StoreSettings
        order = self.get_object()

        store = StoreSettings.objects.first()
        bank_info = {
            'bank_name': store.bank_name if store else '',
            'bank_account': store.bank_account if store else '',
            'bank_holder': store.bank_holder if store else '',
            'dana_number': store.dana_number if store else '',
            'gopay_number': store.gopay_number if store else '',
            'shopeepay_number': store.shopeepay_number if store else '',
            'ovo_number': store.ovo_number if store else '',
            'qris_image': store.qris_image.url if store and store.qris_image else None,
        }

        payment_data = None
        try:
            payment = order.payment
            from .serializers import PaymentSerializer
            payment_data = PaymentSerializer(payment).data
        except Exception:
            pass

        return Response({
            'status': 'success',
            'data': {
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'payment_method': order.payment_method,
                'payment_method_display': order.get_payment_method_display(),
                'bank_info': bank_info,
                'payment': payment_data,
            }
        })

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Update order status (used by HQ / external system).
        POST /api/v1/inventory/restock-orders/{id}/update-status/
        Body: { "status": "PREPARING" }
        """
        order = self.get_object()
        new_status = request.data.get('status', '').upper()
        valid_statuses = dict(RestockOrder.STATUS_CHOICES).keys()

        if new_status not in valid_statuses:
            return Response(
                {'status': 'error', 'message': f'Invalid status. Valid: {list(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        order.status = new_status

        # Set timestamp for the new status
        status_timestamp_map = {
            'PAID': 'paid_at',
            'PREPARING': 'preparing_at',
            'SHIPPED': 'shipped_at',
            'RECEIVED': 'received_at',
            'CANCELLED': 'cancelled_at',
        }
        timestamp_field = status_timestamp_map.get(new_status)
        if timestamp_field:
            setattr(order, timestamp_field, now)

        order.save()

        serializer = self.get_serializer(order)
        return Response({
            'status': 'success',
            'message': f'Status updated to {order.get_status_display()}',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='confirm-received')
    def confirm_received(self, request, pk=None):
        """
        Mitra confirms order received. Auto-restocks ingredients.
        POST /api/v1/inventory/restock-orders/{id}/confirm-received/
        """
        order = self.get_object()

        if order.status not in ('SHIPPED', 'PREPARING', 'PAID'):
            return Response(
                {'status': 'error', 'message': 'Order cannot be confirmed in current status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Auto-restock each ingredient
        for item in order.items.all():
            restock_ingredient(
                ingredient_id=item.ingredient_id,
                quantity=float(item.quantity),
                notes=f"Restock Order {order.order_number}"
            )

        order.status = 'RECEIVED'
        order.received_at = timezone.now()
        order.save()

        serializer = self.get_serializer(order)
        return Response({
            'status': 'success',
            'message': 'Pesanan dikonfirmasi diterima. Stok telah diperbarui.',
            'data': serializer.data
        })
