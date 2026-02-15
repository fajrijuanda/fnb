from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StoreSettings
from .serializers import StoreSettingsSerializer

class StoreSettingsView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update store-wide settings (Payment info).
    Singleton pattern: always returns the first instance.
    """
    serializer_class = StoreSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, created = StoreSettings.objects.get_or_create(pk=1)
        return obj

    def update(self, request, *args, **kwargs):
        # Only staff/admin can update
        if not (request.user.is_staff or request.user.is_superuser):
             return Response({'detail': 'Permission denied.'}, status=403)
        return super().update(request, *args, **kwargs)


class DynamicQRISView(APIView):
    """
    Generate a dynamic QRIS QR code with embedded transaction amount.
    GET /api/v1/settings/qris-dynamic/?amount=50000
    Returns: { qris_base64: "data:image/png;base64,..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        amount = request.query_params.get('amount')
        if not amount:
            return Response(
                {'status': 'error', 'message': 'Parameter amount wajib diisi.'},
                status=400
            )

        try:
            amount_int = int(float(amount))
        except (ValueError, TypeError):
            return Response(
                {'status': 'error', 'message': 'Amount harus berupa angka.'},
                status=400
            )

        if amount_int <= 0:
            return Response(
                {'status': 'error', 'message': 'Amount harus lebih dari 0.'},
                status=400
            )

        store = StoreSettings.objects.first()
        if not store or not store.qris_data:
            return Response(
                {'status': 'error', 'message': 'Data QRIS belum dikonfigurasi di Settings.'},
                status=404
            )

        from .qris_utils import generate_dynamic_qris
        qris_base64 = generate_dynamic_qris(store.qris_data, amount_int)

        if not qris_base64:
            return Response(
                {'status': 'error', 'message': 'Gagal generate QRIS. Pastikan data QRIS valid.'},
                status=500
            )

        return Response({
            'status': 'success',
            'data': {
                'qris_base64': qris_base64,
                'amount': amount_int,
            }
        })

