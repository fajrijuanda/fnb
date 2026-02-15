from django.urls import path
from .views import (
    AIProductDescriptionView,
    AISalesInsightView,
    AIInventoryPredictionView,
    AIChatView
)

urlpatterns = [
    path('generate-description/', AIProductDescriptionView.as_view(), name='ai-generate-description'),
    path('sales-insight/', AISalesInsightView.as_view(), name='ai-sales-insight'),
    path('inventory-prediction/', AIInventoryPredictionView.as_view(), name='ai-inventory-prediction'),
    path('chat/', AIChatView.as_view(), name='ai-chat'),
]
