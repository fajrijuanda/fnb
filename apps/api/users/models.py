from django.db import models
import uuid
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.utils import compress_image

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # Deprecated fields (moved to Mitra/Cashier) but kept for specific simple profile needs if any,
    # Or we can remove them. The plan says remove them.
    
    def save(self, *args, **kwargs):
        if self.avatar:
             if hasattr(self.avatar, 'file'):
                 from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
                 if isinstance(self.avatar.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                     self.avatar = compress_image(self.avatar)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username} Profile'

class Mitra(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mitra_profile')
    location = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Payment Info (For manual transfer instructions or display)
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    bank_account_number = models.CharField(max_length=50, null=True, blank=True)
    bank_account_holder = models.CharField(max_length=255, null=True, blank=True)
    ewallet_type = models.CharField(max_length=50, null=True, blank=True) # e.g. OVO, DANA, GOPAY
    ewallet_number = models.CharField(max_length=50, null=True, blank=True)
    qris_image = models.ImageField(upload_to='qris/', null=True, blank=True)
    qris_data = models.TextField(null=True, blank=True, help_text="Data string dari statis QRIS untuk digenerate menjadi dinamis")
    google_sheet_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID of the Google Sheet for this Mitra's daily report")
    
    def save(self, *args, **kwargs):
        if self.qris_image:
             if hasattr(self.qris_image, 'file'):
                 from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
                 if isinstance(self.qris_image.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                     self.qris_image = compress_image(self.qris_image)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Mitra: {self.user.username}'

class Cashier(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cashier_profile')
    mitra = models.ForeignKey(Mitra, on_delete=models.CASCADE, related_name='cashiers')
    
    def __str__(self):
        return f'Cashier: {self.user.username} (Owned by {self.mitra.user.username})'

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)

    # Ensure UserSession exists
    if not hasattr(instance, 'session'):
        UserSession.objects.create(user=instance)


class UserSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='session')
    active_device_id = models.UUIDField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} Session"


class TrustedDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trusted_devices')
    device_id = models.UUIDField(db_index=True)
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'device_id')

    def __str__(self):
        return f"{self.device_name} ({self.user.username})"


class LoginAttempt(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_attempts')
    device_id = models.UUIDField()
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} - {self.status}"

