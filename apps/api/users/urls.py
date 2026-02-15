from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomLoginView, UserProfileView, UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
