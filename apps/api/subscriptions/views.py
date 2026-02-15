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
            # Show all MITRA subscriptions. Admin should not see Cashier or other random subscriptions.
            return Subscription.objects.filter(user__mitra_profile__isnull=False).order_by('-created_at')
        if hasattr(user, 'mitra_profile'):
            return Subscription.objects.filter(user=user)
        return Subscription.objects.none()
