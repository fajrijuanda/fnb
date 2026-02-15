from django.db import models
from django.conf import settings
from core.utils import compress_image

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Payment'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan_name = models.CharField(max_length=100)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_proof = models.ImageField(upload_to='payments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.payment_proof:
             if hasattr(self.payment_proof, 'file'):
                 from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
                 if isinstance(self.payment_proof.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                     self.payment_proof = compress_image(self.payment_proof)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan_name} ({self.status})"
