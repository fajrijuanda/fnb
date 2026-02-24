import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from PIL import Image
import io

user = User.objects.filter(username='mitra2').first()
if getattr(user, 'mitra_profile', None):
    mitra = user.mitra_profile
    print("Initial QRIS:", mitra.qris_image)

    c = APIClient()
    c.force_authenticate(user=user)
    
    img = Image.new('RGB', (100, 100), color = 'red')
    img_io = io.BytesIO()
    img.save(img_io, format='PNG')
    img_io.seek(0)
    img_io.name = 'test_qris.png'
    
    c.patch(f'/api/v1/users/{user.id}/', {'qris_image': img_io}, format='multipart')
    mitra.refresh_from_db()
    print("After Upload:", mitra.qris_image)
    
    res2 = c.patch(f'/api/v1/users/{user.id}/', {'qris_image': ''}, format='multipart')
    print("Delete status:", res2.status_code)
    mitra.refresh_from_db()
    print("After Delete:", mitra.qris_image)
