from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomLoginView, UserProfileView, UserViewSet, 
    LoginAttemptView, ApproveLoginView, PendingLoginsView,
    DeviceManagementView, HeartbeatView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/status/<uuid:attempt_id>/', LoginAttemptView.as_view(), name='login-status'),
    path('auth/approve/', ApproveLoginView.as_view(), name='approve-login'),
    path('auth/pending/', PendingLoginsView.as_view(), name='pending-logins'),
    path('auth/heartbeat/', HeartbeatView.as_view(), name='heartbeat'),
    path('devices/', DeviceManagementView.as_view(), name='device-list'),
    path('devices/<uuid:pk>/', DeviceManagementView.as_view(), name='device-delete'),
    
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
