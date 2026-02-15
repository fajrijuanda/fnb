
import os
import django
from django.contrib.auth import get_user_model

import sys

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()

def create_users():
    # 1. Create Admin (Superuser)
    admin_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

    if not User.objects.filter(username=admin_username).exists():
        print(f"Creating Admin: {admin_username}")
        User.objects.create_superuser(admin_username, admin_email, admin_password)
        print("Admin created successfully.")
    else:
        print(f"Admin {admin_username} already exists.")

    # 2. Create Cashier (Regular User)
    cashier_username = 'kasir'
    cashier_password = 'kasir123'
    cashier_email = 'kasir@example.com'

    if not User.objects.filter(username=cashier_username).exists():
        print(f"Creating Cashier: {cashier_username}")
        user = User.objects.create_user(cashier_username, cashier_email, cashier_password)
        # Explicitly ensure they are not staff/superuser
        user.is_staff = False
        user.is_superuser = False
        user.save()
        print("Cashier created successfully.")
    else:
        print(f"Cashier {cashier_username} already exists.")

if __name__ == '__main__':
    create_users()
