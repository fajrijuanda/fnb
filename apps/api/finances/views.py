from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from .models import Expense
from .serializers import ExpenseSerializer, ExpenseCreateSerializer



class ExpenseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Mitra expenses.
    - Mitra: sees only their own expenses.
    - Superadmin: sees all expenses.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'notes', 'category']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Expense.objects.all()

        # Filter by mitra for non-superadmin users
        # Filter by mitra for non-superadmin users
        if not user.is_superuser:
            if hasattr(user, 'mitra_profile'):
                qs = qs.filter(mitra=user.mitra_profile)
            elif hasattr(user, 'cashier_profile'):
                qs = qs.filter(mitra=user.cashier_profile.mitra)
            else:
                return Expense.objects.none()
        else:
            # Superadmin can filter by mitra_id
            mitra_id = self.request.query_params.get('mitra_id')
            if mitra_id:
                qs = qs.filter(mitra_id=mitra_id)

        # Date filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Category filtering
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        mitra = None
        shift = None
        
        if hasattr(user, 'mitra_profile'):
            mitra = user.mitra_profile
        elif hasattr(user, 'cashier_profile'):
            mitra = user.cashier_profile.mitra
            # Try to get open shift
            from sales.models import Shift
            shift = Shift.objects.filter(cashier=user, status=Shift.Status.OPEN).first()
        else:
             raise Exception("User is not linked to a Mitra.")
             
        serializer.save(mitra=mitra, shift=shift)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get expense summary: today, this week, this month.
        """
        qs = self.get_queryset()
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        today_total = qs.filter(date=today).aggregate(
            total=Sum('amount'))['total'] or 0
        week_total = qs.filter(date__gte=week_start).aggregate(
            total=Sum('amount'))['total'] or 0
        month_total = qs.filter(date__gte=month_start).aggregate(
            total=Sum('amount'))['total'] or 0

        # Category breakdown this month
        category_breakdown = (
            qs.filter(date__gte=month_start)
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        return Response({
            'today': today_total,
            'this_week': week_total,
            'this_month': month_total,
            'category_breakdown': list(category_breakdown),
        })
