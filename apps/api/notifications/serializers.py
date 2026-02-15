from rest_framework import serializers
from .models import Notification, WebPushSubscription

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'related_link', 'created_at']
        read_only_fields = ['recipient', 'created_at']


class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ['endpoint', 'auth', 'p256dh', 'user_agent']

    def create(self, validated_data):
        user = self.context['request'].user
        subscription, created = WebPushSubscription.objects.update_or_create(
            user=user,
            endpoint=validated_data['endpoint'],
            defaults={
                'auth': validated_data['auth'],
                'p256dh': validated_data['p256dh'],
                'user_agent': validated_data.get('user_agent', '')
            }
        )
        return subscription
