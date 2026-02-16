from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            'id', 'mitra', 'amount', 'category', 'category_display',
            'description', 'notes', 'proof_image', 'date', 'shift',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'mitra', 'created_at', 'updated_at']


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating expenses. Mitra is set from request."""

    class Meta:
        model = Expense
        fields = [
            'amount', 'category', 'description', 'notes',
            'proof_image', 'date', 'shift'
        ]
