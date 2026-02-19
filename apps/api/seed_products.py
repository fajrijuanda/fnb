
import os
import django


import sys

# Add project root and apps/api to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, 'apps', 'api'))
sys.path.insert(0, BASE_DIR)

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Category, Product  # noqa: E402

def seed_products():
    from django.conf import settings
    db_settings = settings.DATABASES['default']
    print(f"DEBUG: Using Database Host: {db_settings.get('HOST', 'localhost')}")
    print(f"DEBUG: Using Database Name: {db_settings.get('NAME', 'unknown')}")

    print("Seeding Categories and Products...")

    # 1. Define Categories
    categories_data = [
        {'name': 'Dimsum', 'icon': 'utensils', 'color': 'red', 'order': 1},
        {'name': 'Gyoza', 'icon': 'egg-fried', 'color': 'orange', 'order': 2},
        {'name': 'Wonton', 'icon': 'soup', 'color': 'green', 'order': 3},
    ]

    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'icon': cat_data['icon'],
                'color': cat_data['color'],
                'order': cat_data['order']
            }
        )
        if not created:
             # Update existing category just in case
            category.icon = cat_data['icon']
            category.color = cat_data['color']
            category.order = cat_data['order']
            category.save()
            
        categories[cat_data['name']] = category
        print(f"Category '{cat_data['name']}' ready.")

    # 2. Define Products
    # TIP: For Cloudinary, you can use the path/public_id of the image if it's already uploaded.
    # Example: 'image': 'products/dimsum_single.jpg'
    products_data = [
        # DIMSUM
        {
            'category': 'Dimsum',
            'name': 'Dimsum - Paket Single',
            'description': '3 Pcs. Dimsum Mix Rasa',
            'price': 10000,
            'track_inventory': False,
            'order': 1,
            'image': 'products/dimsum-single.jpg', 
        },
        {
            'category': 'Dimsum',
            'name': 'Dimsum - Paket Bareng',
            'description': '7 Pcs. Dimsum Mix Rasa (Best Seller)',
            'price': 20000,
            'track_inventory': False,
            'order': 2,
            'image': 'products/dimsum-bareng.jpg',
        },
        {
            'category': 'Dimsum',
            'name': 'Dimsum Mentai',
            'description': '6 Pcs. Dimsum Mix Rasa + Saus Mentai Special',
            'price': 30000,
            'track_inventory': False,
            'order': 3,
            'image': 'products/dimsum-mentai.jpg',
        },
        # GYOZA
        {
            'category': 'Gyoza',
            'name': 'Gyoza Kukus - Paket Single',
            'description': '4 Pcs. Gyoza Kukus',
            'price': 10000,
            'track_inventory': False,
            'order': 1,
            'image': 'products/gyoza-kukus-single.jpg',
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Kukus - Paket Bareng',
            'description': '10 Pcs. Gyoza Kukus',
            'price': 20000,
            'track_inventory': False,
            'order': 2,
            'image': 'products/gyoza-kukus-bareng.jpg',
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Mentai',
            'description': '7 Pcs. Gyoza Kukus + Saus Mentai Special',
            'price': 25000,
            'track_inventory': False,
            'order': 3,
            'image': 'products/gyoza-mentai.jpg',
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Goreng - Paket Single',
            'description': '4 Pcs. Gyoza Goreng',
            'price': 10000,
            'track_inventory': False,
            'order': 4,
            'image': 'products/gyoza-goreng-single.jpg',
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Goreng - Paket Bareng',
            'description': '10 Pcs. Gyoza Goreng',
            'price': 20000,
            'track_inventory': False,
            'order': 5,
            'image': 'products/gyoza-goreng-bareng.jpg',
        },
        # WONTON
        {
            'category': 'Wonton',
            'name': 'Wonton Kuah',
            'description': '8 Pcs. Wonton Kuah',
            'price': 10000,
            'track_inventory': False,
            'order': 1,
            'image': 'products/wonton-kuah.jpg',
        },
        {
            'category': 'Wonton',
            'name': 'Wonton Goreng',
            'description': '8 Pcs. Wonton Goreng',
            'price': 10000,
            'track_inventory': False,
            'order': 2,
            'image': 'products/wonton-goreng.jpg',
        }
    ]

    for prod_data in products_data:
        category = categories[prod_data['category']]
        # Prepare defaults
        defaults = {
            'description': prod_data['description'],
            'price': prod_data['price'],
            'track_inventory': prod_data['track_inventory'],
            'is_available': True,
            'order': prod_data['order']
        }
        
        # Only set image in defaults if it is provided
        if prod_data.get('image'):
            defaults['image'] = prod_data['image']

        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            category=category,
            defaults=defaults
        )
        
        if not created:
            product.description = prod_data['description']
            product.price = prod_data['price']
            product.order = prod_data['order']
            
            # Update image if provided in seed data
            if prod_data.get('image'):
                product.image = prod_data['image']
                
            product.save()
            print(f"Updated product: {product.name}")
        else:
            print(f"Created product: {product.name}")

    print("Product seeding completed successfully!")

if __name__ == '__main__':
    seed_products()
