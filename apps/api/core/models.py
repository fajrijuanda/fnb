from django.db import models
from core.utils import compress_image

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
    qris_data = models.TextField(
        blank=True,
        help_text="Raw QRIS EMVCo data string for dynamic QR generation. "
                  "Get this by scanning your static QRIS with any QR reader."
    )

    # External Links
    spreadsheet_url = models.URLField(blank=True, null=True, help_text="Link to external summary spreadsheet")
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and StoreSettings.objects.exists():
            return StoreSettings.objects.first()
        
        if self.qris_image:
             if hasattr(self.qris_image, 'file'):
                 from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
                 if isinstance(self.qris_image.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                     self.qris_image = compress_image(self.qris_image)

        return super(StoreSettings, self).save(*args, **kwargs)
        
    def __str__(self):
        return "Store Payment Settings"


class SeederLog(models.Model):
    """Tracks executed seed scripts to prevent re-running without changes."""
    name = models.CharField(max_length=255, unique=True)
    checksum = models.CharField(max_length=64, help_text="SHA256 checksum of the seed file")
    executed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.executed_at})"
