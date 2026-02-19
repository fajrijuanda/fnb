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


def get_analytics_summary(start_date, end_date, mitra_id=None):
    """
    Get aggregated data for analytics dashboard.
    """
    orders = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status=Order.Status.PAID
    )

    if mitra_id:
        from django.db.models import Q
        orders = orders.filter(
            Q(cashier__cashier_profile__mitra__user__id=mitra_id) | 
            Q(cashier__id=mitra_id)
        )

    # 1. Total Summary
    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
    total_orders = orders.count()
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0

    # 2. Daily Sales Trend
    daily_sales = list(orders.annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        total_sales=Sum('total_amount'),
        total_orders=Count('id')
    ).order_by('date'))

    # 3. Payment Methods Distribution
    payment_methods = list(orders.values('payment_method').annotate(
        total=Sum('total_amount'),
        count=Count('id')
    ).order_by('-total'))

    # 4. Top Selling Products
    # We need to query OrderItem for this
    top_products = list(OrderItem.objects.filter(
        order__in=orders
    ).values('product__name').annotate(
        quantity=Sum('quantity'),
        revenue=Sum('price_at_sale') # Approximate revenue from this product
    ).order_by('-revenue')[:10])

    return {
        'summary': {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'average_order_value': average_order_value
        },
        'daily_sales': daily_sales,
        'payment_methods': payment_methods,
        'top_products': top_products
    }


def get_recent_orders(limit=10):
    """Get most recent orders."""
    return Order.objects.select_related().prefetch_related('items__product')[:limit]

def get_orders_for_export(start_date, end_date=None):
    """
    Get detailed order list for export.
    """
    if end_date is None:
        end_date = start_date
        
    orders = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status=Order.Status.PAID
    ).select_related('cashier', 'mitra').order_by('-created_at')
    
    return orders


def get_profit_loss_report(start_date, end_date=None, mitra=None):
    """
    Calculate profit/loss report:
    - Revenue: total dari order items (price_at_sale * qty + variant + modifier adjustments)
    - COGS (HPP): ingredient cost per recipe * qty + modifier ingredient cost * qty
    - Expenses: total pengeluaran dari finances.Expense
    - Net Profit: Revenue - COGS - Expenses
    """
    from decimal import Decimal
    from catalog.models import ModifierOption
    from inventory.models import Recipe
    from finances.models import Expense

    if end_date is None:
        end_date = start_date

    # 1. Get paid orders in date range
    orders = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status=Order.Status.PAID
    ).prefetch_related('items__product__recipe__items__ingredient')

    # 2. Calculate Revenue and COGS
    total_revenue = Decimal(0)
    total_cogs = Decimal(0)
    product_details = {}  # product_name -> { revenue, cogs, qty }

    for order in orders:
        for item in order.items.all():
            product = item.product
            qty = item.quantity

            # Revenue = subtotal (price_at_sale + variant + modifiers) * qty
            item_revenue = Decimal(item.subtotal)
            total_revenue += item_revenue

            # COGS from recipe ingredients
            item_cogs = Decimal(0)
            try:
                recipe = product.recipe
                for recipe_item in recipe.items.all():
                    ingredient = recipe_item.ingredient
                    cost = ingredient.cost_per_unit * recipe_item.quantity_required * qty
                    item_cogs += cost
            except Recipe.DoesNotExist:
                pass  # No recipe = no ingredient cost (barang jadi)

            # COGS from modifiers
            if item.modifiers_snapshot:
                for mod_snap in item.modifiers_snapshot:
                    mod_id = mod_snap.get('id')
                    if mod_id:
                        try:
                            mod_option = ModifierOption.objects.select_related('ingredient').get(id=mod_id)
                            if mod_option.ingredient and mod_option.quantity_required > 0:
                                cost = mod_option.ingredient.cost_per_unit * mod_option.quantity_required * qty
                                item_cogs += cost
                        except ModifierOption.DoesNotExist:
                            pass

            total_cogs += item_cogs

            # Track per-product breakdown
            pname = product.name
            if pname not in product_details:
                product_details[pname] = {
                    'revenue': Decimal(0),
                    'cogs': Decimal(0),
                    'qty': 0
                }
            product_details[pname]['revenue'] += item_revenue
            product_details[pname]['cogs'] += item_cogs
            product_details[pname]['qty'] += qty

    # 3. Get Expenses for the period
    expense_qs = Expense.objects.filter(
        date__gte=start_date,
        date__lte=end_date,
    )
    total_expenses = expense_qs.aggregate(total=Sum('amount'))['total'] or 0

    # Expense breakdown by category
    expense_breakdown = list(
        expense_qs.values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    # 4. Calculate margins
    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - Decimal(total_expenses)
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else Decimal(0)
    net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else Decimal(0)

    # 5. Build product breakdown sorted by revenue
    product_breakdown = []
    for pname, detail in sorted(product_details.items(), key=lambda x: x[1]['revenue'], reverse=True):
        margin = detail['revenue'] - detail['cogs']
        margin_pct = (margin / detail['revenue'] * 100) if detail['revenue'] > 0 else Decimal(0)
        product_breakdown.append({
            'product': pname,
            'qty': detail['qty'],
            'revenue': float(detail['revenue']),
            'cogs': float(detail['cogs']),
            'profit': float(margin),
            'margin_pct': round(float(margin_pct), 1),
        })

    return {
        'period': {
            'start': str(start_date),
            'end': str(end_date),
        },
        'revenue': float(total_revenue),
        'cogs': float(total_cogs),
        'gross_profit': float(gross_profit),
        'expenses': float(total_expenses),
        'net_profit': float(net_profit),
        'gross_margin': round(float(gross_margin), 1),
        'net_margin': round(float(net_margin), 1),
        'product_breakdown': product_breakdown[:10],
        'expense_breakdown': expense_breakdown,
    }

