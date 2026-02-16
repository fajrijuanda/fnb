from rest_framework import serializers
from .models import Order, OrderItem, Shift
from catalog.models import Product


class OrderItemInputSerializer(serializers.Serializer):
    """
    Serializer untuk input item order dari frontend.
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    modifier_option_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
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
        from catalog.models import Product, ProductVariant, ModifierOption

        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            
            # Handle Variant
            variant_snapshot = None
            variant_id = item_data.get('variant_id')
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                    variant_snapshot = {
                        'id': variant.id,
                        'name': variant.name,
                        'price_adjustment': variant.price_adjustment,
                        'sku': variant.sku
                    }
                    if variant.price_adjustment: # Check specifically for variant price
                         pass # handled in subtotal property, but we assume price_at_sale is BASE price
                except ProductVariant.DoesNotExist:
                    raise serializers.ValidationError(f"Variant ID {variant_id} invalid for product {product.name}")

            # Handle Modifiers
            modifiers_snapshot = []
            modifier_ids = item_data.get('modifier_option_ids', [])
            if modifier_ids:
                modifiers = ModifierOption.objects.filter(id__in=modifier_ids)
                # Verify they belong to product's groups? Optional for now but good practice.
                # For now just trust ID existence.
                for mod in modifiers:
                    modifiers_snapshot.append({
                        'id': mod.id,
                        'group_name': mod.group.name,
                        'name': mod.name,
                        'price_adjustment': mod.price_adjustment
                    })

            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                price_at_sale=product.price,
                variant_snapshot=variant_snapshot,
                modifiers_snapshot=modifiers_snapshot,
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
            'variant_snapshot',
            'modifiers_snapshot',
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


class ShiftSerializer(serializers.ModelSerializer):
    """
    Serializer for Shift model.
    """
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    difference = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    current_cash = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id',
            'cashier',
            'cashier_name',
            'start_time',
            'end_time',
            'initial_cash',
            'current_cash',
            'final_cash_system',
            'final_cash_actual',
            'difference',
            'status',
            'status_display',
            'notes'
        ]
        read_only_fields = ['id', 'cashier', 'start_time', 'end_time', 'final_cash_system', 'status']

    def get_current_cash(self, obj):
        """
        Calculate current cash in drawer (Initial + Cash Sales).
        """
        from django.db.models import Sum
        cash_sales = obj.orders.filter(
            payment_method='CASH', 
            status='PAID'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        return obj.initial_cash + cash_sales
