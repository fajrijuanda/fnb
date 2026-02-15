
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
    print("Seeding Users with new Mitra/Cashier models...")

    # 1. Create Admin (Superuser)
    admin_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

    if not User.objects.filter(username=admin_username).exists():
        print(f"Creating Admin: {admin_username}")
        user = User.objects.create_superuser(admin_username, admin_email, admin_password)
        
        # Create Lifetime Subscription for Admin
        from subscriptions.models import Subscription
        from django.utils import timezone
        from datetime import timedelta
        
        Subscription.objects.create(
            user=user,
            plan_name='Lifetime Access (Admin)',
            status='active',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=36500) # 100 Years
        )
        print("Admin created successfully with Lifetime Subscription.")
    else:
        print(f"Admin {admin_username} already exists.")
        # Ensure subscription exists
        user = User.objects.get(username=admin_username)
        from subscriptions.models import Subscription
        if not Subscription.objects.filter(user=user).exists():
             from django.utils import timezone
             from datetime import timedelta
             Subscription.objects.create(
                user=user,
                plan_name='Lifetime Access (Admin)',
                status='active',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=36500)
            )
             print("Added Lifetime Subscription to existing Admin.")

    # 2. Mitra Users
    mitras = [
        {'username': 'mitra1', 'email': 'mitra1@example.com', 'location': 'Jakarta Selatan', 'plan': 'Eksekutif', 'subscribed': True, 'expired': False},
        {'username': 'mitra2', 'email': 'mitra2@example.com', 'location': 'Bandung', 'plan': 'Eksklusif', 'subscribed': True, 'expired': False},
        {'username': 'mitra3', 'email': 'mitra3@example.com', 'location': 'Surabaya', 'plan': 'Eksekutif', 'subscribed': True, 'expired': True},
        {'username': 'mitra4', 'email': 'mitra4@example.com', 'location': 'Medan', 'plan': 'Eksklusif', 'subscribed': True, 'expired': True},
    ]

    for m_data in mitras:
        _create_mitra(m_data)

    # 3. Cashier Users (1 per Mitra)
    cashiers = [
        {'username': 'kasir1', 'email': 'kasir1@example.com', 'owner': 'mitra1'},
        {'username': 'kasir2', 'email': 'kasir2@example.com', 'owner': 'mitra2'},
        {'username': 'kasir3', 'email': 'kasir3@example.com', 'owner': 'mitra3'},
        {'username': 'kasir4', 'email': 'kasir4@example.com', 'owner': 'mitra4'},
    ]

    for c_data in cashiers:
        _create_cashier(c_data)


def _create_mitra(data):
    from users.models import Mitra
    from subscriptions.models import Subscription
    from django.utils import timezone
    from datetime import timedelta

    username = data['username']
    if not User.objects.filter(username=username).exists():
        print(f"Creating Mitra: {username}")
        user = User.objects.create_user(username, data['email'], 'mitra123')
        user.is_staff = True
        user.save()
        
        # Create Mitra Profile
        Mitra.objects.create(user=user, location=data['location'])
        
        # Create Subscription (2 YEARS for Mitra / Lifetime for Admin)
        if data.get('subscribed', False):
            # Check if user is superuser (Admin) -> Lifetime
            if user.is_superuser:
                duration_days = 36500 # 100 Years
                plan_name = 'Lifetime Access (Admin)'
                start_date = timezone.now().date()
            else:
                duration_days = 730 # 2 Years
                plan_name = data.get('plan', 'Standard')
                
                # Check if expired requested
                if data.get('expired', False):
                    start_date = timezone.now().date() - timedelta(days=duration_days + 1)
                    end_date = timezone.now().date() - timedelta(days=1)
                    status = 'expired'
                else:
                    start_date = timezone.now().date()
                    end_date = timezone.now().date() + timedelta(days=duration_days)
                    status = 'active'
            
            if not user.is_superuser: # Admin handled above or logic same
                 Subscription.objects.create(
                    user=user,
                    plan_name=plan_name,
                    status=status,
                    start_date=start_date,
                    end_date=end_date
                )

        print(f"  -> Mitra {username} created.")
    else:
        print(f"  Mitra {username} exists. Updating...")
        user = User.objects.get(username=username)
        
        # Update/Create Mitra Profile
        mitra, _ = Mitra.objects.get_or_create(user=user)
        if mitra.location != data['location']:
            mitra.location = data['location']
            mitra.save()
            
        # Update Subscription
        sub = Subscription.objects.filter(user=user).first()
        if data.get('subscribed', False):
            # Check if user is superuser (Admin) -> Lifetime
            if user.is_superuser:
                 duration_days = 36500
                 plan_name = 'Lifetime Access (Admin)'
            else:
                 duration_days = 730
                 plan_name = data.get('plan', 'Standard')

            if not sub:
                 Subscription.objects.create(
                    user=user,
                    plan_name=plan_name,
                    status='active',
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date() + timedelta(days=duration_days)
                )
            else:
                # OPTIONAL: Reset end_date if needed, but usually we just ensure it exists.
                # Only update plan name for clarity
                sub.plan_name = plan_name
                # Ensure correct status based on data
                if data.get('expired', False):
                    sub.status = 'expired'
                    sub.end_date = timezone.now().date() - timedelta(days=1)
                else:
                    sub.status = 'active'
                    # Optionally extend end_date if active, or leave as is
                    if sub.end_date < timezone.now().date():
                         sub.end_date = timezone.now().date() + timedelta(days=duration_days)
                
                sub.save()
        
def _create_cashier(data):
    from users.models import Cashier
    
    username = data['username']
    owner_username = data['owner']
    
    try:
        owner_user = User.objects.get(username=owner_username)
        if not hasattr(owner_user, 'mitra_profile'):
             print(f"  Skipping {username}: Owner {owner_username} is not a Mitra.")
             return
        owner_mitra = owner_user.mitra_profile
    except User.DoesNotExist:
        print(f"  Skipping {username}: Owner {owner_username} not found.")
        return

    if not User.objects.filter(username=username).exists():
        print(f"Creating Cashier: {username} (Owner: {owner_username})")
        user = User.objects.create_user(username, data['email'], 'kasir123')
        user.is_staff = False
        user.save()
        
        Cashier.objects.create(user=user, mitra=owner_mitra)
        print(f"  -> Cashier {username} created.")
    else:
        print(f"  Cashier {username} exists. Updating owner...")
        user = User.objects.get(username=username)
        cashier, created = Cashier.objects.get_or_create(user=user, defaults={'mitra': owner_mitra})
        if not created and cashier.mitra != owner_mitra:
            cashier.mitra = owner_mitra
            cashier.save()
            print(f"  -> Re-linked {username} to {owner_username}.")

if __name__ == '__main__':
    import traceback
    try:
        create_users()
    except Exception:
        traceback.print_exc()
