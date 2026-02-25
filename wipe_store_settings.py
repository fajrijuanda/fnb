import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import StoreSettings

print('Checking StoreSettings...')
count = 0
for settings in StoreSettings.objects.all():
    has_image = bool(settings.qris_image)
    print(f'StoreSettings ID={settings.id}, has_image={has_image}')
    if has_image:
        print(f"  Deleting image: {settings.qris_image.name}")
        settings.qris_image.delete(save=False)
    
    settings.qris_image = None
    settings.qris_data = ''
    try:
        settings.save()
        count += 1
    except Exception as e:
        print(f"Error saving StoreSettings {settings.id}: {e}")

print(f'Done wiping {count} StoreSettings records.')
