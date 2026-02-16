"""
URL configuration for CloudPOS API.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.views import StoreSettingsView, DynamicQRISView


@api_view(['GET'])
def api_root(request):
    """API root endpoint with available endpoints info."""
    return Response({
        'status': 'success',
        'message': 'CloudPOS API v1',
        'endpoints': {
            'categories': '/api/v1/catalog/categories/',
            'products': '/api/v1/catalog/products/',
            'orders': '/api/v1/sales/orders/',
            'ingredients': '/api/v1/inventory/ingredients/',
            'recipes': '/api/v1/inventory/recipes/',
            'stock_logs': '/api/v1/inventory/logs/',
            'store_settings': '/api/v1/settings/store/',
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', api_root, name='api-root'),
    path('api/v1/catalog/', include('catalog.urls')),
    path('api/v1/sales/', include('sales.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/inventory/', include('inventory.urls')),
    # path('api/v1/ai/', include('ai_assistant.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/subscriptions/', include('subscriptions.urls')),
    path('api/v1/finances/', include('finances.urls')),
    path('api/v1/settings/store/', StoreSettingsView.as_view(), name='store-settings'),
    path('api/v1/settings/qris-dynamic/', DynamicQRISView.as_view(), name='qris-dynamic'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
