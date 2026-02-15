from rest_framework import viewsets, filters
from rest_framework.response import Response

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductListSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories.
    
    list: GET /api/v1/catalog/categories/
    retrieve: GET /api/v1/catalog/categories/{id}/
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for products (POS menu).
    
    list: GET /api/v1/catalog/products/
    retrieve: GET /api/v1/catalog/products/{id}/
    
    Query params:
    - category: Filter by category slug
    - available: Filter by availability (true/false)
    - search: Search by product name
    """
    queryset = Product.objects.select_related('category').filter(is_available=True)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category slug
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by availability
        available = self.request.query_params.get('available')
        if available is not None:
            if available.lower() == 'true':
                queryset = queryset.filter(is_available=True)
            elif available.lower() == 'false':
                queryset = queryset.filter(is_available=False)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override to wrap response in standard format."""
        response = super().list(request, *args, **kwargs)
        return Response({
            'status': 'success',
            'data': response.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Override to wrap response in standard format."""
        response = super().retrieve(request, *args, **kwargs)
        return Response({
            'status': 'success',
            'data': response.data
        })
