
import os
import django
from django.contrib.auth import get_user_model

import sys

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, 'apps', 'api'))
sys.path.insert(0, BASE_DIR)

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()

def create_users():
    from django.conf import settings
    from users.models import UserProfile

    db_settings = settings.DATABASES['default']
    print(f"DEBUG: Using Database Host: {db_settings.get('HOST', 'localhost')}")
    print(f"DEBUG: Using Database Name: {db_settings.get('NAME', 'unknown')}")

    # 1. Create Admin (Superuser) - always has full access
    admin_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

    if not User.objects.filter(username=admin_username).exists():
        print(f"Creating Admin: {admin_username}")
        user = User.objects.create_superuser(admin_username, admin_email, admin_password)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_subscribed = True
        profile.save()
        print("Admin created successfully.")
    else:
        print(f"Admin {admin_username} already exists.")

    # 2. Mitra 1 (Eksekutif - Subscribed)
    _create_user('mitra1', 'mitra123', 'mitra1@example.com', is_staff=True, is_subscribed=True, location='Jakarta Selatan', plan_name='Eksekutif')

    # 3. Mitra 2 (Eksklusif - Subscribed)
    _create_user('mitra2', 'mitra123', 'mitra2@example.com', is_staff=True, is_subscribed=True, location='Bandung', plan_name='Eksklusif')

    # 4. Kasir 1 (Linked to Mitra 1)
    _create_user('kasir1', 'kasir123', 'kasir1@example.com', is_staff=False, is_subscribed=True, location='Jakarta Selatan', owner_username='mitra1')

    # 5. Kasir 2 (Linked to Mitra 2)
    _create_user('kasir2', 'kasir123', 'kasir2@example.com', is_staff=False, is_subscribed=True, location='Bandung', owner_username='mitra2')

    # 6. Mitra Eksekutif (Unsubscribed)
    _create_user('mitra_eksekutif', 'mitra123', 'eksekutif@example.com', is_staff=True, is_subscribed=False, location='Surabaya', plan_name='Eksekutif')

    # 7. Mitra Eksklusif (Unsubscribed)
    _create_user('mitra_eksklusif', 'mitra123', 'eksklusif@example.com', is_staff=True, is_subscribed=False, location='Medan', plan_name='Eksklusif')


def _create_user(username, password, email, is_staff=False, is_subscribed=False, location=None, plan_name='Business', owner_username=None):
    from users.models import UserProfile
    from subscriptions.models import Subscription
    from django.utils import timezone
    from datetime import timedelta

    if not User.objects.filter(username=username).exists():
        print(f"Creating User: {username}")
        user = User.objects.create_user(username, email, password)
        user.is_staff = is_staff
        user.is_superuser = False
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_subscribed = is_subscribed
        profile.location = location
        
        if owner_username:
            try:
                owner = User.objects.get(username=owner_username)
                profile.owner = owner
            except User.DoesNotExist:
                print(f"  Warning: Owner {owner_username} not found for {username}")
        
        profile.save()

        # Create Subscription record if subscribed
        if is_subscribed:
            Subscription.objects.create(
                user=user,
                plan_name=plan_name,
                status='active',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=30)
            )

        role = 'mitra' if is_staff else 'cashier'
        sub = 'subscribed' if is_subscribed else 'not subscribed'
        print(f"  -> {username} ({role}, {sub}, {location}, Plan: {plan_name}) created successfully.")
    else:
        # Update existing user
        user = User.objects.get(username=username)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        updated = False
        if location and profile.location != location:
            profile.location = location
            updated = True
        
        # Link owner if needed
        if owner_username:
             try:
                owner = User.objects.get(username=owner_username)
                if profile.owner != owner:
                    profile.owner = owner
                    updated = True
             except User.DoesNotExist:
                pass
        
        # Force subscription status update if changed in seeder
        if is_subscribed != profile.is_subscribed:
            profile.is_subscribed = is_subscribed
            updated = True
            
        if updated:
            profile.save()
            print(f"  -> Updated {username} profile.")
        
        # Check/Create subscription if missing (and subscribed)
        # Also update plan name if exists
        sub_exists = Subscription.objects.filter(user=user, status='active').first()
        if is_subscribed:
            if not sub_exists:
                Subscription.objects.create(
                    user=user,
                    plan_name=plan_name,
                    status='active',
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date() + timedelta(days=30)
                )
                print(f"  -> Created missing subscription for {username}.")
            elif sub_exists.plan_name != plan_name:
                sub_exists.plan_name = plan_name
                sub_exists.save()
                print(f"  -> Updated subscription plan for {username} to {plan_name}.")


if __name__ == '__main__':
    create_users()
