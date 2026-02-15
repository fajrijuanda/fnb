from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, WebPushSubscriptionView, WebPushTestView, VapidPublicKeyView

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('push/subscribe/', WebPushSubscriptionView.as_view(), name='push-subscribe'),
    path('push/test/', WebPushTestView.as_view(), name='push-test'),
    path('push/key/', VapidPublicKeyView.as_view(), name='push-key'),
    path('', include(router.urls)),
]
