import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Mitra

mitras = Mitra.objects.all()
count_image = 0
count_data = 0

for m in mitras:
    if m.qris_image:
        m.qris_image = None
        count_image += 1
    if m.qris_data:
        m.qris_data = ''
        count_data += 1
    m.save()

print(f"Cleared {count_image} qris_image(s) and {count_data} qris_data(s).")
