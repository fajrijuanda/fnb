from rest_framework import serializers
from .models import Order, OrderItem
from catalog.models import Product


class OrderItemInputSerializer(serializers.Serializer):
    """
    Serializer untuk input item order dari frontend.
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class CreateOrderSerializer(serializers.Serializer):
    """
    Serializer untuk membuat order baru.
    """
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    items = OrderItemInputSerializer(many=True, min_length=1)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_items(self, items):
        """
        Validasi bahwa semua product_id valid dan tersedia.
        """
        product_ids = [item['product_id'] for item in items]
        existing_products = Product.objects.filter(id__in=product_ids, is_available=True)
        existing_ids = set(existing_products.values_list('id', flat=True))
        
        for item in items:
            if item['product_id'] not in existing_ids:
                raise serializers.ValidationError(
                    f"Produk dengan ID {item['product_id']} tidak tersedia."
                )
        
        return items

    def create(self, validated_data):
        """
        Buat order dan order items.
        """
        items_data = validated_data.pop('items')
        
        # Create order
        order = Order.objects.create(
            payment_method=validated_data['payment_method'],
            notes=validated_data.get('notes', ''),
            status=Order.Status.PAID,
            cashier=validated_data.get('cashier')
        )
        
        # Create order items
        total = 0
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                price_at_sale=product.price,
                note=item_data.get('note', '')
            )
            total += order_item.subtotal
        
        # Update total
        order.total_amount = total
        order.save()
        
        return order


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer untuk output order item.
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'quantity',
            'price_at_sale',
            'note',
            'subtotal'
        ]


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer untuk output order lengkap.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'invoice_number',
            'created_at',
            'status',
            'status_display',
            'total_amount',
            'payment_method',
            'payment_method_display',
            'notes',
            'items'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """
    Serializer ringkas untuk list order.
    """
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'invoice_number',
            'created_at',
            'status',
            'total_amount',
            'payment_method',
            'items_count'
        ]

    def get_items_count(self, obj):
        return obj.items.count()
