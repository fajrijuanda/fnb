
import os
import django


# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.api.catalog.models import Category, Product  # noqa: E402

def seed_products():
    print("Seeding Categories and Products...")

    # 1. Define Categories
    categories_data = [
        {'name': 'Dimsum', 'icon': 'utensils', 'color': 'orange', 'order': 1},
        {'name': 'Gyoza', 'icon': 'chef-hat', 'color': 'red', 'order': 2},
        {'name': 'Wonton', 'icon': 'soup', 'color': 'yellow', 'order': 3},
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
    products_data = [
        # DIMSUM
        {
            'category': 'Dimsum',
            'name': 'Dimsum - Paket Single',
            'description': '3 Pcs. Dimsum Mix Rasa',
            'price': 10000,
            'track_inventory': False
        },
        {
            'category': 'Dimsum',
            'name': 'Dimsum - Paket Bareng',
            'description': '7 Pcs. Dimsum Mix Rasa (Best Seller)',
            'price': 20000,
            'track_inventory': False
        },
        {
            'category': 'Dimsum',
            'name': 'Dimsum Mentai',
            'description': '6 Pcs. Dimsum Mix Rasa + Saus Mentai Special',
            'price': 30000,
            'track_inventory': False
        },
        # GYOZA
        {
            'category': 'Gyoza',
            'name': 'Gyoza Kukus - Paket Single',
            'description': '4 Pcs. Gyoza Kukus',
            'price': 10000,
            'track_inventory': False
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Goreng - Paket Single',
            'description': '4 Pcs. Gyoza Goreng',
            'price': 10000,
            'track_inventory': False
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Kukus - Paket Bareng',
            'description': '10 Pcs. Gyoza Kukus',
            'price': 20000,
            'track_inventory': False
        },
        {
            'category': 'Gyoza',
            'name': 'Gyoza Goreng - Paket Bareng',
            'description': '10 Pcs. Gyoza Goreng',
            'price': 20000,
            'track_inventory': False
        },
         {
            'category': 'Gyoza',
            'name': 'Gyoza Mentai',
            'description': '7 Pcs. Gyoza Kukus + Saus Mentai Special',
            'price': 25000,
            'track_inventory': False
        },
        # WONTON
        {
            'category': 'Wonton',
            'name': 'Wonton Kuah',
            'description': '8 Pcs. Wonton Kuah',
            'price': 10000,
            'track_inventory': False
        },
        {
            'category': 'Wonton',
            'name': 'Wonton Goreng',
            'description': '8 Pcs. Wonton Goreng',
            'price': 10000,
            'track_inventory': False
        },
    ]

    for prod_data in products_data:
        category = categories[prod_data['category']]
        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            category=category,
            defaults={
                'description': prod_data['description'],
                'price': prod_data['price'],
                'track_inventory': prod_data['track_inventory'],
                'is_available': True
            }
        )
        if not created:
            product.description = prod_data['description']
            product.price = prod_data['price']
            product.save()
            print(f"Updated product: {product.name}")
        else:
            print(f"Created product: {product.name}")

    print("Product seeding completed successfully!")

if __name__ == '__main__':
    seed_products()
