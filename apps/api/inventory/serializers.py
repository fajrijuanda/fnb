from rest_framework import serializers
from .models import Ingredient, Recipe, RecipeItem, StockLog


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
