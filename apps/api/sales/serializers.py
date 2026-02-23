from rest_framework import serializers
from .models import Order, OrderItem, Shift
from catalog.models import Product
from django.db.models import Sum, F, Case, When, IntegerField


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
    cash_received = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    customer_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
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

    def validate(self, attrs):
        payment_method = attrs.get('payment_method')
        cash_received = attrs.get('cash_received')

        if payment_method == Order.PaymentMethod.CASH and cash_received is None:
            raise serializers.ValidationError({
                'cash_received': 'Nominal uang diterima wajib diisi untuk pembayaran tunai.'
            })

        return attrs

    def create(self, validated_data):
        """
        Buat order dan order items.
        """
        items_data = validated_data.pop('items')
        validated_data.pop('customer_name', None)
        cash_received_input = validated_data.pop('cash_received', None)
        payment_method = validated_data['payment_method']
        notes = validated_data.get('notes', '')
        cashier = validated_data.get('cashier')
        
        # Prepare order items and pre-calculate total before saving order
        total = 0
        from catalog.models import Product, ProductVariant, ModifierOption
        prepared_items = []

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
            modifiers_price_adjustment = 0
            if modifier_ids:
                modifiers = ModifierOption.objects.filter(id__in=modifier_ids)
                # Verify they belong to product's groups? Optional for now but good practice.
                # For now just trust ID existence.
                for mod in modifiers:
                    modifiers_price_adjustment += int(mod.price_adjustment)
                    modifiers_snapshot.append({
                        'id': mod.id,
                        'group_name': mod.group.name,
                        'name': mod.name,
                        'price_adjustment': mod.price_adjustment
                    })

            variant_price_adjustment = int(variant_snapshot['price_adjustment']) if variant_snapshot else 0
            unit_price = int(product.price) + variant_price_adjustment + modifiers_price_adjustment
            subtotal = unit_price * item_data['quantity']
            total += subtotal

            prepared_items.append({
                'product': product,
                'quantity': item_data['quantity'],
                'price_at_sale': product.price,
                'variant_snapshot': variant_snapshot,
                'modifiers_snapshot': modifiers_snapshot,
                'note': item_data.get('note', '')
            })

        cash_received = None
        change_amount = 0
        if payment_method == Order.PaymentMethod.CASH:
            cash_received = int(cash_received_input or 0)
            if cash_received < total:
                raise serializers.ValidationError({
                    'cash_received': f'Nominal tunai tidak cukup. Minimal Rp {total:,}.'
                })
            change_amount = cash_received - total

        # Create order
        order = Order.objects.create(
            payment_method=payment_method,
            notes=notes,
            status=Order.Status.PAID,
            cashier=cashier,
            cash_received=cash_received,
            change_amount=change_amount
        )

        # Create order items
        for item_data in prepared_items:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price_at_sale=item_data['price_at_sale'],
                variant_snapshot=item_data['variant_snapshot'],
                modifiers_snapshot=item_data['modifiers_snapshot'],
                note=item_data['note']
            )
        
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
            'cash_received',
            'change_amount',
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
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_cash = serializers.SerializerMethodField()
    expenses = serializers.SerializerMethodField()

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
            'notes',
            'expenses'
        ]
        read_only_fields = ['id', 'cashier', 'start_time', 'end_time', 'final_cash_system', 'status']

    def get_expenses(self, obj):
        """Get summary of expenses for this shift."""
        # Avoid circular import by importing inside method
        from finances.serializers import ExpenseSerializer
        return ExpenseSerializer(obj.expenses.all(), many=True).data

    def get_current_cash(self, obj):
        """
        Calculate current cash in drawer (Initial + Cash Sales - Cash Expenses).
        """
        try:
            cash_sales = obj.orders.filter(
                payment_method=Order.PaymentMethod.CASH, 
                status=Order.Status.PAID
            ).aggregate(
                total=Sum(
                    Case(
                        When(cash_received__isnull=False, then=F('cash_received') - F('change_amount')),
                        default=F('total_amount'),
                        output_field=IntegerField()
                    )
                )
            )['total'] or 0
            
            # Subtract expenses
            cash_expenses = obj.expenses.aggregate(total=Sum('amount'))['total'] or 0
            
            return obj.initial_cash + cash_sales - cash_expenses
        except Exception as e:
            print(f"Error calculating current cash: {e}")
            return obj.initial_cash
