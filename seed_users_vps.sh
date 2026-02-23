#!/bin/bash
set -e

cd /var/www/fnb/apps/api
source venv/bin/activate
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
export DJANGO_SUPERUSER_USERNAME="admin"
export DJANGO_SUPERUSER_EMAIL="admin@omden.com"
export DJANGO_SUPERUSER_PASSWORD="admin123"

echo "=== Creating Superuser ==="
python manage.py createsuperuser --noinput 2>&1 || echo "(may already exist)"

echo "=== Creating Mitra + Cashier via shell ==="
python manage.py shell << 'PYEOF'
from django.contrib.auth import get_user_model
from users.models import Mitra, Cashier
from subscriptions.models import Subscription
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

# Create Mitra 1 (Eksekutif - Active)
if not User.objects.filter(username='mitra1').exists():
    u = User.objects.create_user('mitra1', 'mitra1@example.com', 'mitra123', is_staff=True)
    Mitra.objects.create(user=u, location='Jakarta Selatan')
    Subscription.objects.create(user=u, plan_name='Eksekutif', status='active', start_date=timezone.now().date(), end_date=timezone.now().date() + timedelta(days=730))
    print("Created mitra1")

# Create Mitra 2 (Eksklusif - Active)
if not User.objects.filter(username='mitra2').exists():
    u = User.objects.create_user('mitra2', 'mitra2@example.com', 'mitra123', is_staff=True)
    Mitra.objects.create(user=u, location='Bandung')
    Subscription.objects.create(user=u, plan_name='Eksklusif', status='active', start_date=timezone.now().date(), end_date=timezone.now().date() + timedelta(days=730))
    print("Created mitra2")

# Create Cashier for mitra1
if not User.objects.filter(username='kasir1').exists():
    m = User.objects.get(username='mitra1').mitra_profile
    u = User.objects.create_user('kasir1', 'kasir1@example.com', 'kasir123')
    Cashier.objects.create(user=u, mitra=m)
    print("Created kasir1")

# Create Cashier for mitra2 
if not User.objects.filter(username='kasir2').exists():
    m = User.objects.get(username='mitra2').mitra_profile
    u = User.objects.create_user('kasir2', 'kasir2@example.com', 'kasir123')
    Cashier.objects.create(user=u, mitra=m)
    print("Created kasir2")

print("User seeding done!")
PYEOF

echo "=== Users Seeded! ==="
