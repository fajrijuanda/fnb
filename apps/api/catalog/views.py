from rest_framework import viewsets, filters
from rest_framework.response import Response

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductListSerializer


from rest_framework.permissions import IsAdminUser

class IsSuperUserOrReadOnly(IsAdminUser):
    def has_permission(self, request, view):
        is_admin = super().has_permission(request, view)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        return is_admin

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for categories.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products (POS menu).
    """
    queryset = Product.objects.select_related('category').filter(is_available=True)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    permission_classes = [IsSuperUserOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        # Admin can see all, but for basic POS usage we usually filter available.
        # But if Admin wants to manage, they might want to see unavailable too?
        # The current queryset filters is_available=True.
        # This might hide "hidden" products from Admin if they want to edit them.
        # Let's adjust:
        
        user = self.request.user
        if user.is_staff or user.is_superuser:
            queryset = Product.objects.select_related('category').all()
        else:
            queryset = Product.objects.select_related('category').filter(is_available=True)
            
        # Filter by category slug
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by availability (explicit override)
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
