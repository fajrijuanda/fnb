from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Subscription
from .serializers import SubscriptionSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Subscription.objects.all().order_by('-created_at')
        if hasattr(user, 'mitra_profile'):
            return Subscription.objects.filter(user=user)
        return Subscription.objects.none()
