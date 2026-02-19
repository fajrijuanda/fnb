
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

from inventory.models import Ingredient  # noqa: E402
from catalog.models import Product, ModifierGroup, ModifierOption  # noqa: E402

def seed_varian_topping():
    print("Seeding Varian Topping Dimsum...")

    # 1. Create Ingredients
    ingredients_data = [
        {'name': 'Wortel Serut', 'unit': 'gram', 'min_stock': 1000},
        {'name': 'Crab Stick', 'unit': 'pcs', 'min_stock': 50},
        {'name': 'Udang Kupas', 'unit': 'gram', 'min_stock': 1000},
        {'name': 'Keju Block', 'unit': 'gram', 'min_stock': 500},
        {'name': 'Jamur Cincang', 'unit': 'gram', 'min_stock': 500},
    ]

    ingredients = {}
    for data in ingredients_data:
        ing, created = Ingredient.objects.get_or_create(
            name=data['name'],
            defaults={
                'unit': data['unit'],
                'min_stock_alert': data['min_stock'],
                'current_stock': 1000 # Default stock
            }
        )
        ingredients[data['name']] = ing
        print(f"{'Created' if created else 'Verified'} Ingredient: {ing.name}")

    # 2. Create Modifier Group
    group, created = ModifierGroup.objects.get_or_create(
        name="Varian Topping",
        defaults={
            'min_selection': 0,
            'max_selection': 3
        }
    )
    
    # Link to Dimsum Products
    dimsum_products = Product.objects.filter(category__name='Dimsum')
    for p in dimsum_products:
        group.products.add(p)
    print(f"Linked 'Varian Topping' to {dimsum_products.count()} Dimsum products.")

    # 3. Create Modifier Options
    options_data = [
        {'name': 'Wortel', 'ingredient': 'Wortel Serut', 'qty': 2, 'price': 0}, # 2 gram
        {'name': 'Crab Stick', 'ingredient': 'Crab Stick', 'qty': 0.5, 'price': 0}, # Half stick?
        {'name': 'Udang', 'ingredient': 'Udang Kupas', 'qty': 5, 'price': 1000}, # Extra price for Udang?
        {'name': 'Keju', 'ingredient': 'Keju Block', 'qty': 5, 'price': 500},
        {'name': 'Jamur', 'ingredient': 'Jamur Cincang', 'qty': 5, 'price': 0},
    ]

    for data in options_data:
        ing = ingredients.get(data['ingredient'])
        if not ing:
            print(f"Skipping {data['name']}, ingredient missing.")
            continue

        opt, created = ModifierOption.objects.get_or_create(
            group=group,
            name=data['name'],
            defaults={
                'price_adjustment': data['price'],
                'ingredient': ing,
                'quantity_required': data['qty']
            }
        )
        if not created:
            opt.ingredient = ing
            opt.quantity_required = data['qty']
            opt.save()
            
        print(f"{'Created' if created else 'Updated'} Option: {opt.name}")


    print("\nSeeding Completed!")
    
    # 4. Seed Mitra Stock for Toppings
    print("\nSeeding Mitra Stock for Toppings...")
    from users.models import Mitra
    from subscriptions.models import Subscription
    from inventory.models import IngredientStock

    mitras = Mitra.objects.all()
    for mitra in mitras:
        user = mitra.user
        sub = Subscription.objects.filter(user=user, status='active').order_by('-created_at').first()
        if not sub:
            continue
        
        plan = sub.plan_name.lower()
        print(f"Processing {user.username} (Plan: {sub.plan_name})")

        # Define Stock Levels based on Plan
        # Eksekutif (Standard), Eksklusif (Double)
        multiplier = 2 if 'eksklusif' in plan else 1
        
        topping_stock = {
            'Wortel Serut': 500 * multiplier,   # 500g / 1kg
            'Crab Stick': 20 * multiplier,      # 20pcs / 40pcs
            'Udang Kupas': 500 * multiplier,    # 500g / 1kg
            'Keju Block': 250 * multiplier,     # 250g / 500g
            'Jamur Cincang': 250 * multiplier,  # 250g / 500g
        }

        for ing_name, qty in topping_stock.items():
            ingredient = ingredients.get(ing_name)
            if not ingredient:
                continue
            
            stock, created = IngredientStock.objects.get_or_create(
                mitra=mitra,
                ingredient=ingredient,
                defaults={
                    'current_stock': qty,
                    'min_stock_alert': 10
                }
            )
            if not created:
                stock.current_stock = qty
                stock.save()
            print(f"  -> Set {ing_name}: {qty}")

    print("\nTopping Stock Seeding Completed!")

