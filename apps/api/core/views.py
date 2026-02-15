from rest_framework import generics, permissions
from rest_framework.response import Response
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
