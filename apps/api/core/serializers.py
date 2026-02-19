from rest_framework import serializers
from .models import StoreSettings

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            'id', 
            'bank_name', 'bank_account', 'bank_holder',
            'dana_number', 'gopay_number', 'shopeepay_number', 'ovo_number',
            'qris_image', 'qris_data', 'spreadsheet_url', 'updated_at'
        ]
