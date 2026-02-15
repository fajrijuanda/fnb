import os
import django

import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.api.catalog.models import Category, Product  # noqa: E402

# 1. Create or Get 'Paket' Category
# Ensure it's first by setting order=0 and shifting others if needed (or just ensure it has lowest)
paket_cat, created = Category.objects.get_or_create(
    name='Paket',
    defaults={
        'slug': 'paket',
        'icon': 'package',
        'order': 0, # Top priority
        'is_active': True
    }
)

if not created and paket_cat.order != 0:
    paket_cat.order = 0
    paket_cat.save()

print(f"Category '{paket_cat.name}' ready.")

# 2. Create Sample Paket Products
products_data = [
    {
        'name': 'Paket Hemat A',
        'price': 25000,
        'description': 'Nasi Putih + Ayam Geprek Original + Es Teh Manis',
        'image': None 
    },
    {
        'name': 'Paket Hemat B',
        'price': 28000,
        'description': 'Nasi Goreng Spesial + Telur Mata Sapi + Kerupuk + Teh Botol',
        'image': None
    },
    {
        'name': 'Paket Keluarga',
        'price': 120000,
        'description': '4 Nasi Putih + 1 Ekor Ayam Bakar + Cah Kangkung + 4 Es Jeruk + Tahu Tempe',
        'image': None
    },
    {
        'name': 'Paket Ngopi Santai',
        'price': 15000,
        'description': 'Kopi Hitam + Pisang Goreng (2 pcs)',
        'image': None
    },
    {
        'name': 'Paket Anak',
        'price': 22000,
        'description': 'Nasi Putih + Nugget Ayam (4 pcs) + Telur Dadar + Susu Kotak',
        'image': None
    }
]

for data in products_data:
    product, created = Product.objects.get_or_create(
        name=data['name'],
        defaults={
            'price': data['price'],
            'description': data['description'],
            'category': paket_cat,
            'is_available': True,
            'track_inventory': False # Paket logic often assumes unlimited or recipe based
        }
    )
    if not created:
        # Update description/price if exists to match new data
        product.price = data['price']
        product.description = data['description']
        product.category = paket_cat
        product.save()
        print(f"Updated: {product.name}")
    else:
        print(f"Created: {product.name}")

print("Paket data seeding completed!")
