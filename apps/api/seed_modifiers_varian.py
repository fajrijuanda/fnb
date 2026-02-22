
import os
import django
import sys

# from decimal import Decimal


# Add project root and apps/api to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, 'apps', 'api'))
sys.path.insert(0, BASE_DIR)

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Product, ModifierGroup, ModifierOption  # noqa: E402

def seed_varian_topping():
    print("Seeding Varian Rasa Menu...")

    # 1. Create Modifier Group
    group, created = ModifierGroup.objects.get_or_create(
        name="Varian Rasa",
        defaults={
            'min_selection': 0,
            'max_selection': 1
        }
    )
    if not created:
         group.max_selection = 1
         group.save()
         
    # Remove old modifier options if any related to this group
    ModifierOption.objects.filter(group=group).delete()
    
    # Link to Dimsum and Wonton Products
    variant_products = Product.objects.filter(category__name__in=['Dimsum', 'Wonton'])
    for p in variant_products:
        group.products.add(p)
    print(f"Linked 'Varian Rasa' to {variant_products.count()} products.")

    # 2. Create Modifier Options
    options_data = [
        {'name': 'Satu Rasa'},
        {'name': 'Pilih Rasa'},
    ]

    for data in options_data:
        opt, created = ModifierOption.objects.get_or_create(
            group=group,
            name=data['name'],
            defaults={
                'price_adjustment': 0,
                'quantity_required': 0
            }
        )
            
        print(f"{'Created' if created else 'Updated'} Option: {opt.name}")


    print("\nSeeding Completed!")

if __name__ == '__main__':
    seed_varian_topping()
