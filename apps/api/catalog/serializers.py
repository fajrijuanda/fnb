from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'color', 'order', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model with stock status."""
    
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    category_details = CategorySerializer(source='category', read_only=True)
    stock_status = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    stock = serializers.IntegerField(source='current_stock', required=False)
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'price', 
            'image',
            'image_url',
            'category',
            'category_id',
            'category_details',
            'stock_status',
            'is_available',
            'stock',
            'track_inventory',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_stock_status(self, obj) -> dict:
        """Return stock status from model property."""
        return obj.stock_status
    
    def get_image_url(self, obj) -> str | None:
        """Return full image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listing (POS menu)."""
    
    category = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image_url', 'category', 'stock_status']
    
    def get_stock_status(self, obj) -> dict:
        return obj.stock_status
    
    def get_image_url(self, obj) -> str | None:
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
