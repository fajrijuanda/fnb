import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json

c = Client()
cashier = User.objects.filter(cashier_profile__isnull=False).last()
if not cashier:
    print("No cashier found")
    exit()

print(f"Testing with cashier: {cashier.username} (ID: {cashier.id})")
mitra = cashier.cashier_profile.mitra
print(f"Mitra: {mitra.user.username}, QRIS Data: {mitra.qris_data}, QRIS Image: {mitra.qris_image}")

# Force login
c.force_login(cashier)

# Simulating SecurityPuller
response = c.get(f'/api/v1/users/{cashier.id}/')
print(f"Response Status: {response.status_code}")
try:
    data = response.json()
    print("Response Data:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Could not parse JSON: {e}")
