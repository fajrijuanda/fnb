from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, ModifierGroupViewSet, ModifierOptionViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'modifier-groups', ModifierGroupViewSet, basename='modifier-group')
router.register(r'modifier-options', ModifierOptionViewSet, basename='modifier-option')

urlpatterns = [
    path('', include(router.urls)),
]
