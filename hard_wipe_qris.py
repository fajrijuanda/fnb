import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Mitra

print('Checking all Mitra profiles...')
count = 0
for mitra in Mitra.objects.all():
    has_image = bool(mitra.qris_image)
    print(f'Mitra user={mitra.user.username}, has_image={has_image}')
    if has_image:
        print(f"  Deleting image: {mitra.qris_image.name}")
        mitra.qris_image.delete(save=False)
    
    mitra.qris_image = None
    mitra.qris_data = ''
    try:
        mitra.save()
        count += 1
    except Exception as e:
        print(f"Error saving {mitra.user.username}: {e}")

print(f'Done wiping {count} Mitra records.')
