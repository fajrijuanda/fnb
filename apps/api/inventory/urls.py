from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, RecipeViewSet, StockLogViewSet, RestockOrderViewSet

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'logs', StockLogViewSet, basename='stocklog')
router.register(r'restock-orders', RestockOrderViewSet, basename='restock-order')

urlpatterns = [
    path('', include(router.urls)),
]
