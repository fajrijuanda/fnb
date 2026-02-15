"""
Sales Selectors Module
Complex queries for sales data.

Following Service Layer Pattern:
- All complex queries go here (NOT in views.py)
- Views only handle request/response
"""
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from .models import Order, OrderItem


def get_daily_sales_summary(date=None):
    """
    Get sales summary for a specific date.
    Returns: order count, total revenue, breakdown by payment method.
    """
    if date is None:
        date = timezone.now().date()
    
    orders = Order.objects.filter(
        created_at__date=date,
        status=Order.Status.PAID
    )
    
    # Basic stats
    total_orders = orders.count()
    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Breakdown by payment method
    payment_breakdown = orders.values('payment_method').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    )
    
    # Top selling products
    top_products = OrderItem.objects.filter(
        order__in=orders
    ).values('product__name').annotate(
        quantity_sold=Sum('quantity'),
        revenue=Sum('price_at_sale')
    ).order_by('-quantity_sold')[:5]
    
    return {
        'date': str(date),
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'payment_breakdown': list(payment_breakdown),
        'top_products': list(top_products)
    }


def get_sales_by_date_range(start_date, end_date):
    """
    Get sales data for a date range.
    Returns daily breakdown of orders and revenue.
    """
    orders = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status=Order.Status.PAID
    )
    
    daily_data = orders.annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        order_count=Count('id'),
        revenue=Sum('total_amount')
    ).order_by('date')
    
    return list(daily_data)


def get_recent_orders(limit=10):
    """Get most recent orders."""
    return Order.objects.select_related().prefetch_related('items__product')[:limit]
