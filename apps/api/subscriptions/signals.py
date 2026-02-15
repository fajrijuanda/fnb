from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Subscription
from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Subscription)
def notify_on_subscription_update(sender, instance, created, **kwargs):
    if created:
        # Notify Admin about new subscription (pending payment)
        admins = User.objects.filter(role='superadmin')
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                title="Langganan Baru",
                message=f"Mitra {instance.user.username} mengajukan langganan {instance.plan_name}.",
                notification_type='info',
                related_link=f"/admin/subscriptions" # Admin page to approve
            )
    else:
        # Notify User on status change
        if instance.status == 'active':
            Notification.objects.create(
                recipient=instance.user,
                title="Langganan Aktif",
                message=f"Langganan {instance.plan_name} Anda telah aktif.",
                notification_type='success',
                related_link="/admin/subscriptions"
            )
        elif instance.status == 'expired':
            Notification.objects.create(
                recipient=instance.user,
                title="Langganan Berakhir",
                message=f"Langganan {instance.plan_name} Anda telah berakhir.",
                notification_type='warning',
                related_link="/admin/subscriptions"
            )
