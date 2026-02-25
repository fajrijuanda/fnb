import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Mitra

try:
    updated = Mitra.objects.update(qris_image=None, qris_data='')
    print(f"SUCCESS: Wiped QRIS data for {updated} Mitra profiles.")
except Exception as e:
    import traceback
    traceback.print_exc()
