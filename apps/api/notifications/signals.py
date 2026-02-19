from django.db.models.signals import post_save
from django.dispatch import receiver
from sales.models import Order
from .models import Notification

@receiver(post_save, sender=Order)
def notify_mitra_on_order(sender, instance, created, **kwargs):
    """
    Notify Mitra (Store Owner) when a new order is created by a Cashier.
    """
    if created and instance.cashier:
        # Check if Cashier has a Mitra (Owner)
        recipient = None
        if hasattr(instance.cashier, 'cashier_profile'):
             recipient = instance.cashier.cashier_profile.mitra.user
        elif hasattr(instance.cashier, 'mitra_profile'):
             # Mitra created the order themselves. Notify them?
             # Yes, for confirmation.
             recipient = instance.cashier
        
        if recipient:
            Notification.objects.create(
                recipient=recipient,
                title="Pesanan Baru",
                message=f"Pesanan #{instance.invoice_number or instance.id} baru saja dibuat oleh {instance.cashier.username}.",
                notification_type='success',
                # Link ke admin panel
                related_link=f"/admin/orders?search={instance.invoice_number or instance.id}" 
            )

        # Notify the Cashier as well (Confirmation)
        # Check to avoid duplicate if cashier IS the mitra (rare but possible in dev)
        if instance.cashier != recipient:
             Notification.objects.create(
                recipient=instance.cashier,
                title="Transaksi Berhasil",
                message=f"Pesanan #{instance.invoice_number or instance.id} berhasil diproses.",
                notification_type='success',
                # No specific link for POS side yet, or maybe to history?
                related_link="#" 
            )

# Placeholder for Subscription Signals (if Subscription model exists)
# @receiver(post_save, sender=Subscription)
# def notify_on_subscription(sender, instance, **kwargs):
#     ...
