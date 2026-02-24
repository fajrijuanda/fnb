import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from users.models import Mitra
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

# Create a valid 1x1 PNG image
file_obj = io.BytesIO()
image = Image.new("RGBA", size=(1, 1), color=(256, 0, 0))
image.save(file_obj, 'png')
file_obj.seek(0)
img = SimpleUploadedFile("qris_valid.png", file_obj.read(), content_type="image/png")

c = APIClient()
mitra = Mitra.objects.filter(user__username='mitra2').first()
user = mitra.user

print(f"Testing with mitra user: {user.username} (ID: {user.id})")
c.force_authenticate(user=user)

response = c.patch(
    f'/api/v1/users/{user.id}/', 
    {'qris_image': img},
    format='multipart'
)
print(f"PATCH Response Status: {response.status_code}")
print("Response JSON:", response.content)

mitra.refresh_from_db()
print(f"Saved DB QRIS Image: {mitra.qris_image.name if mitra.qris_image else 'NO_IMAGE'}")

# Fetch as cashier
c2 = APIClient()
cashier = user.mitra_profile.cashiers.first()
if cashier:
    c2.force_authenticate(user=cashier.user)
    print("Testing GET as cashier:", cashier.user.username)
    res2 = c2.get(f'/api/v1/users/{cashier.user.id}/')
    payment_info = res2.json().get('payment_info', {})
    print("Cashier fetched QRIS Image URL:", payment_info.get('qris_image'))
