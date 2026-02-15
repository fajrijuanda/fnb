from rest_framework import serializers
from .models import Subscription
from users.serializers import UserSerializer

class SubscriptionSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'user_details', 'plan_name', 'start_date', 'end_date', 'status', 'created_at']
