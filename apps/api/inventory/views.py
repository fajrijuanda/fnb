from django.db import models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Ingredient, Recipe, StockLog
from .serializers import (
    IngredientSerializer,
    RecipeSerializer,
    StockLogSerializer
)
from .services import restock_ingredient


class IngredientViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Ingredients (Raw Materials).
    Used by Admin Dashboard for inventory management.
    """
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by status
        stock_status = request.query_params.get('status')
        if stock_status:
            if stock_status.upper() == 'LOW':
                queryset = queryset.filter(current_stock__lte=models.F('min_stock_alert'), current_stock__gt=0)
            elif stock_status.upper() == 'CRITICAL':
                queryset = queryset.filter(current_stock__lte=0)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """
        Add stock to an ingredient.
        POST /api/v1/inventory/ingredients/{id}/restock/
        Body: { "quantity": 100, "notes": "Purchase from supplier" }
        """
        ingredient = self.get_object()
        quantity = request.data.get('quantity', 0)
        notes = request.data.get('notes', '')
        
        if quantity <= 0:
            return Response(
                {'status': 'error', 'message': 'Quantity must be positive.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restock_ingredient(ingredient.id, quantity, notes)
        ingredient.refresh_from_db()
        
        serializer = self.get_serializer(ingredient)
        return Response({
            'status': 'success',
            'message': f'Berhasil menambah {quantity} {ingredient.unit} {ingredient.name}.',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """
        Get all ingredients with low or critical stock levels.
        GET /api/v1/inventory/ingredients/low-stock/
        """
        # Get ingredients where current_stock <= min_stock_alert
        queryset = Ingredient.objects.filter(
            current_stock__lte=models.F('min_stock_alert')
        ).order_by('current_stock')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data
        })


class RecipeViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Recipes.
    Links Products to their Ingredients.
    """
    queryset = Recipe.objects.select_related('product').prefetch_related('items__ingredient').all()
    serializer_class = RecipeSerializer


class StockLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for Stock Logs.
    Used for audit trail and reporting.
    """
    queryset = StockLog.objects.select_related('ingredient', 'product').all()
    serializer_class = StockLogSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by ingredient
        ingredient_id = request.query_params.get('ingredient')
        if ingredient_id:
            queryset = queryset.filter(ingredient_id=ingredient_id)
        
        # Filter by movement type
        movement_type = request.query_params.get('type')
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type.upper())
        
        # Limit results
        limit = request.query_params.get('limit', 50)
        queryset = queryset[:int(limit)]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'data': serializer.data})
