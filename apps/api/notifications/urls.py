from django.urls import path
from .views import NotificationListView, MarkNotificationReadView, MarkAllReadView, DeleteNotificationView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('read-all/', MarkAllReadView.as_view(), name='notification-read-all'),
    path('<int:pk>/', DeleteNotificationView.as_view(), name='notification-delete'),
]
