import os
import sys
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db'
os.environ['DEBUG'] = 'False'
os.environ['ALLOWED_HOSTS'] = '103.87.66.233,localhost,127.0.0.1'
os.environ['SECRET_KEY'] = 'omden-fnb-production-secret-key-2026-change-me'

sys.path.insert(0, '/var/www/fnb/apps/api')
django.setup()

# Run migrations first
from django.core.management import call_command  # noqa: E402
print("Running migrations...")
call_command('migrate', '--noinput')
print("Migrations done!")

from django.contrib.auth import get_user_model  # noqa: E402
User = get_user_model()

# 1. Create Superuser
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@omden.com', 'admin123')
        print("Created admin")
    else:
        print("admin exists")
except Exception as e:
    print(f"Admin error: {e}")

# 2. Create Mitra users
from users.models import Mitra, Cashier  # noqa: E402
from subscriptions.models import Subscription  # noqa: E402
from django.utils import timezone  # noqa: E402
from datetime import timedelta  # noqa: E402

mitras = [
    {'username': 'mitra1', 'email': 'mitra1@example.com', 'location': 'Jakarta Selatan', 'plan': 'Eksekutif'},
    {'username': 'mitra2', 'email': 'mitra2@example.com', 'location': 'Bandung', 'plan': 'Eksklusif'},
]

for m in mitras:
    try:
        if not User.objects.filter(username=m['username']).exists():
            u = User.objects.create_user(m['username'], m['email'], 'mitra123')
            u.is_staff = True
            u.save()
            Mitra.objects.create(user=u, location=m['location'])
            Subscription.objects.create(
                user=u, plan_name=m['plan'], status='active',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=730)
            )
            print(f"Created {m['username']}")
        else:
            print(f"{m['username']} exists")
            # Ensure Mitra profile exists
            u = User.objects.get(username=m['username'])
            if not hasattr(u, 'mitra_profile'):
                Mitra.objects.create(user=u, location=m['location'])
                print(f"  Created Mitra profile for {m['username']}")
            if not Subscription.objects.filter(user=u).exists():
                Subscription.objects.create(
                    user=u, plan_name=m['plan'], status='active',
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date() + timedelta(days=730)
                )
                print(f"  Created Subscription for {m['username']}")
    except Exception as e:
        print(f"Error creating {m['username']}: {e}")
        traceback.print_exc()

# 3. Create Cashiers
cashiers = [
    {'username': 'kasir1', 'email': 'kasir1@example.com', 'owner': 'mitra1'},
    {'username': 'kasir2', 'email': 'kasir2@example.com', 'owner': 'mitra2'},
]

for c in cashiers:
    try:
        if not User.objects.filter(username=c['username']).exists():
            owner = User.objects.get(username=c['owner'])
            u = User.objects.create_user(c['username'], c['email'], 'kasir123')
            Cashier.objects.create(user=u, mitra=owner.mitra_profile)
            print(f"Created {c['username']}")
        else:
            print(f"{c['username']} exists")
    except Exception as e:
        print(f"Error creating {c['username']}: {e}")
        traceback.print_exc()

# Admin subscription
try:
    admin = User.objects.get(username='admin')
    if not Subscription.objects.filter(user=admin).exists():
        Subscription.objects.create(
            user=admin, plan_name='Lifetime Access (Admin)', status='active',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=36500)
        )
        print("Created admin subscription")
except Exception as e:
    print(f"Admin sub error: {e}")

print("\n=== User seeding complete! ===")
