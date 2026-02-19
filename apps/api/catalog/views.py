from rest_framework import viewsets, filters
from rest_framework.response import Response

from .models import Category, Product, ModifierGroup, ModifierOption
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    ProductListSerializer,
    ModifierGroupSerializer,
    ModifierOptionSerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action


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
    # queryset = Category.objects.filter(is_active=True) # Replaced by get_queryset
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserOrReadOnly]

    def get_queryset(self):
        from django.db.models import Case, When, Value, IntegerField
        
        return Category.objects.filter(is_active=True).annotate(
            custom_order=Case(
                When(name__icontains="Paket Single", then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by('custom_order', 'order', 'name')


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products (POS menu).
    Supports automated availability based on IngredientStock for Mitras.
    """
    queryset = Product.objects.all()
    permission_classes = [IsSuperUserOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_available', 'track_inventory']
    search_fields = ['name']
    ordering_fields = ['name', 'price', 'category__order']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.select_related('category').all()
            
        # Determine the Mitra context (either direct Mitra or via Cashier)
        mitra = None
        if hasattr(user, 'mitra_profile'):
            mitra = user.mitra_profile
        elif hasattr(user, 'cashier_profile'):
            mitra = user.cashier_profile.mitra

        # Availability Logic for Mitra/Cashier
        if mitra:
            # UNLIMITED STOCK MODE: Bypass ProductAvailability check
            from django.db.models import F
            
            queryset = queryset.annotate(
                mitra_availability=F('is_available')
            )
            
            # Filter specifically if requested (e.g., POS showing only available)
            available_param = self.request.query_params.get('available')
            if available_param is not None:
                if available_param.lower() == 'true':
                    queryset = queryset.filter(mitra_availability=True)
                elif available_param.lower() == 'false':
                    queryset = queryset.filter(mitra_availability=False)
        
        elif not (user.is_staff or user.is_superuser):
             # For public/anonymous, show only globally available
             queryset = queryset.filter(is_available=True)

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

    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """
        Deprecated for Mitra (now automated via stock).
        But SuperAdmin might use it to toggle Global Availability.
        """
        product = self.get_object()
        if request.user.is_superuser:
            product.is_available = not product.is_available
            product.save()
            return Response({'status': 'availability toggled', 'is_available': product.is_available})
        else:
            return Response({'error': 'Automated availability. Check stock.'}, status=403)


class ModifierGroupViewSet(viewsets.ModelViewSet):
    queryset = ModifierGroup.objects.all()
    serializer_class = ModifierGroupSerializer
    permission_classes = [IsSuperUserOrReadOnly]


class ModifierOptionViewSet(viewsets.ModelViewSet):
    queryset = ModifierOption.objects.all()
    serializer_class = ModifierOptionSerializer
    permission_classes = [IsSuperUserOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = ModifierOption.objects.select_related('group').all()

        # Determine Mitra context
        mitra = None
        if hasattr(user, 'mitra_profile'):
            mitra = user.mitra_profile
        elif hasattr(user, 'cashier_profile'):
            mitra = user.cashier_profile.mitra

        if mitra:
            # UNLIMITED STOCK MODE: Bypass IngredientStock check
            from django.db.models import Value, BooleanField
            
            queryset = queryset.annotate(
                mitra_availability=Value(True, output_field=BooleanField())
            )
        
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        return Response({'error': 'Availability is now automated based on stock.'}, status=400)
