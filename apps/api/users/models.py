from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # Deprecated fields (moved to Mitra/Cashier) but kept for specific simple profile needs if any,
    # Or we can remove them. The plan says remove them.
    
    def __str__(self):
        return f'{self.user.username} Profile'

class Mitra(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mitra_profile')
    location = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    # Subscription info could be here or link to Subscription model.
    # For now, let's keep is_subscribed logic derived or in Subscription model, but Mitra is the anchor.
    
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
