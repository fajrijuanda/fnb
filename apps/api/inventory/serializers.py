from rest_framework import serializers
from .models import Ingredient, Recipe, RecipeItem, StockLog, RestockOrder, RestockOrderItem


class IngredientSerializer(serializers.ModelSerializer):
    """Serializer for Ingredient model."""
    status = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'unit', 'current_stock', 'min_stock_alert', 'status']
        read_only_fields = ['id']

    def get_status(self, obj):
        """Return stock status: SAFE, LOW, or CRITICAL."""
        if obj.current_stock <= 0:
            return 'CRITICAL'
        elif obj.current_stock <= obj.min_stock_alert:
            return 'LOW'
        return 'SAFE'


class RecipeItemSerializer(serializers.ModelSerializer):
    """Serializer for RecipeItem (ingredient in a recipe)."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_unit = serializers.CharField(source='ingredient.unit', read_only=True)

    class Meta:
        model = RecipeItem
        fields = ['id', 'ingredient', 'ingredient_name', 'ingredient_unit', 'quantity_required']


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for Recipe with nested items."""
    items = RecipeItemSerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'product', 'product_name', 'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StockLogSerializer(serializers.ModelSerializer):
    """Serializer for StockLog entries."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True, allow_null=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)

    class Meta:
        model = StockLog
        fields = [
            'id', 'ingredient', 'ingredient_name', 'product', 'product_name',
            'change_amount', 'final_stock', 'movement_type', 'reason', 'notes',
            'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at']


class RestockOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for individual restock order items."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = RestockOrderItem
        fields = [
            'id', 'ingredient', 'ingredient_name',
            'quantity', 'unit', 'unit_price', 'line_total'
        ]


class RestockOrderSerializer(serializers.ModelSerializer):
    """Serializer for restock orders with nested items."""
    items = RestockOrderItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = RestockOrder
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'payment_method', 'payment_method_display',
            'shipping_address', 'shipping_cost', 'subtotal', 'total_amount',
            'notes', 'items',
            'created_at', 'updated_at', 'paid_at', 'preparing_at',
            'shipped_at', 'received_at', 'cancelled_at',
            'external_order_id',
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'total_amount',
            'created_at', 'updated_at', 'paid_at', 'preparing_at',
            'shipped_at', 'received_at', 'cancelled_at',
            'external_order_id',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Calculate subtotal from items
        subtotal = sum(
            item['quantity'] * item.get('unit_price', 0)
            for item in items_data
        )
        validated_data['subtotal'] = subtotal
        order = RestockOrder.objects.create(**validated_data)

        for item_data in items_data:
            RestockOrderItem.objects.create(order=order, **item_data)

        return order
