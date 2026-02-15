from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, ShiftViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'shifts', ShiftViewSet, basename='shift')

urlpatterns = [
    path('', include(router.urls)),
]
