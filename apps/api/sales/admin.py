from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']
    fields = ['product', 'quantity', 'price_at_sale', 'note', 'subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number',
        'created_at',
        'status',
        'payment_method',
        'total_amount',
        'items_count'
    ]
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['invoice_number']
    readonly_fields = ['id', 'invoice_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Items'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price_at_sale', 'subtotal']
    list_filter = ['order__created_at']
    search_fields = ['order__invoice_number', 'product__name']
