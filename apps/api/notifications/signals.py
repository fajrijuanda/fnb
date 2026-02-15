from django.db.models.signals import post_save
from django.dispatch import receiver
from sales.models import Order
from users.models import User
from .models import Notification

@receiver(post_save, sender=Order)
def notify_mitra_on_order(sender, instance, created, **kwargs):
    """
    Notify Mitra (Store Owner) when a new order is created by a Cashier.
    """
    if created and instance.cashier:
        # Assuming the system is single-tenant for now or Mitra is identified by role 'mitra'
        # In a real multi-tenant system, we'd link Cashier to Mitra via a Store relation.
        # For now, notify all 'mitra' users (or specific one if linked).
        
        # Logic: Find Mitra users. 
        # Ideally, Cashier is created by a Mitra. We need a way to link them.
        # If no direct link, we might skip or notify all Mitras (bad for multi-tenant).
        # Let's assume for this project scope: 1 admin/mitra group or small scale.
        
        mitras = User.objects.filter(mitra_profile__isnull=False)
        for mitra in mitras:
            Notification.objects.create(
                recipient=mitra,
                title="Pesanan Baru",
                message=f"Pesanan #{instance.id} baru saja dibuat oleh {instance.cashier.username}.",
                notification_type='success',
                related_link="/admin/orders" 
            )

# Placeholder for Subscription Signals (if Subscription model exists)
# @receiver(post_save, sender=Subscription)
# def notify_on_subscription(sender, instance, **kwargs):
#     ...
