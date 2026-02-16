from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
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
    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        from django.utils import timezone
        from datetime import timedelta
        from rest_framework.response import Response

        subscription = self.get_object()
        months = int(request.data.get('months', 1))
        
        today = timezone.now().date()
        
        # If expired, reset start date to today. If active, extend end_date.
        if subscription.end_date < today:
            subscription.start_date = today
            base_date = today
            subscription.status = 'active'
        else:
            base_date = subscription.end_date

        # Approximate 30 days per month
        subscription.end_date = base_date + timedelta(days=months * 30)
        subscription.save()

        return Response(self.get_serializer(subscription).data)
