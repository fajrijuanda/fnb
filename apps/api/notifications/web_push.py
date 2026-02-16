import json
try:
    from pywebpush import webpush, WebPushException
except ImportError:
    webpush = None
    WebPushException = None

from django.conf import settings
from .models import WebPushSubscription

def send_web_push(subscription, payload):
    """
    Send a Web Push notification to a specific subscription.
    """
    if not webpush:
        print("pywebpush not installed. Skipping notification.")
        return False

    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "auth": subscription.auth,
                    "p256dh": subscription.p256dh,
                }
            },
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
            ttl=60
        )
        return True
    except WebPushException as ex:
        if ex.response and ex.response.status_code == 410:
            # Subscription has expired or is no longer valid
            subscription.delete()
        print(f"Web Push failed: {ex}")
        return False

def send_notification_to_user(user, title, message, url="/notifications"):
    """
    Send notification to all of user's Web Push subscriptions.
    """
    payload = {
        "title": title,
        "body": message,
        "url": url,
        "icon": "/icons/icon-192x192.png",
        "badge": "/icons/icon-192x192.png" # simplified
    }
    
    subscriptions = WebPushSubscription.objects.filter(user=user)
    success_count = 0
    
    for sub in subscriptions:
        if send_web_push(sub, payload):
            success_count += 1
            
    return success_count
