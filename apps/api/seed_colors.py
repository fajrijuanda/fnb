import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Category

# Mapping from ProductsPage legacy colors to Hex values
# approximations based on tailwind colors
COLOR_MAPPING = {
    'Makanan Berat': '#F97316', # Orange-500
    'Makanan Ringan': '#F59E0B', # Amber-500
    'Minuman': '#3B82F6', # Blue-500
    'Snack': '#F59E0B', # Amber-500
    'Paket': '#6366F1', # Indigo-500
    'Dessert': '#EC4899', # Pink-500
}

def seed_colors():
    print("Seeding category colors...")
    categories = Category.objects.all()
    updated_count = 0
    
    for category in categories:
        if category.name in COLOR_MAPPING:
            category.color = COLOR_MAPPING[category.name]
            category.save()
            print(f"Updated {category.name} to {category.color}")
            updated_count += 1
        else:
            print(f"Skipping {category.name} (no mapping found)")
            
    print(f"Finished. Updated {updated_count} categories.")

if __name__ == '__main__':
    seed_colors()
