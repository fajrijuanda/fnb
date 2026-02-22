import os
import django
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, 'apps', 'api'))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Product, ModifierGroup  # noqa: E402

print("Updating old products")
try:
    Product.objects.filter(category__name__in=['Dimsum', 'Gyoza', 'Wonton']).update(is_available=False)
except Exception as e:
    print(f"Update failed: {e}")
    try:
        Product.objects.filter(category__name__in=['Dimsum', 'Gyoza', 'Wonton']).delete()
    except Exception as d_e:
        print(f"Delete failed: {d_e}")

try:
    ModifierGroup.objects.filter(name__in=['Varian Topping', 'Varian Rasa']).delete()
except Exception as e:
    print(f"Mod delete failed: {e}")
