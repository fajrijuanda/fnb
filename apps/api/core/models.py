from django.db import models

class StoreSettings(models.Model):
    """Singleton model for store-wide settings (Payment info, etc.)"""
    
    # Bank Info
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account = models.CharField(max_length=100, blank=True)
    bank_holder = models.CharField(max_length=100, blank=True)
    
    # E-Wallets
    dana_number = models.CharField(max_length=20, blank=True)
    gopay_number = models.CharField(max_length=20, blank=True)
    shopeepay_number = models.CharField(max_length=20, blank=True)
    ovo_number = models.CharField(max_length=20, blank=True)
    
    # QRIS
    qris_image = models.ImageField(upload_to='settings/', blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and StoreSettings.objects.exists():
            return StoreSettings.objects.first()
        return super(StoreSettings, self).save(*args, **kwargs)
        
    def __str__(self):
        return "Store Payment Settings"
