
import os
import django
import sys
from decimal import Decimal

# Add project root and apps/api to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, 'apps', 'api'))
sys.path.insert(0, BASE_DIR)

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Ingredient, Recipe, RecipeItem, IngredientStock  # noqa: E402
from catalog.models import Product, ModifierGroup, ModifierOption  # noqa: E402
from users.models import Mitra  # noqa: E402
from subscriptions.models import Subscription  # noqa: E402

def seed_inventory():
    print("Seeding Inventory (Semi-finished Goods)...")

    # 1. Create Ingredients (Bahan Baku / Semi-finished)
    ingredients_data = [
        {'name': 'Dimsum Ayam Beku', 'unit': 'pcs', 'min_stock': 100},
        {'name': 'Gyoza Ayam Beku', 'unit': 'pcs', 'min_stock': 100},
        {'name': 'Wonton Ayam Beku', 'unit': 'pcs', 'min_stock': 100},
        {'name': 'Saus Mentai', 'unit': 'gram', 'min_stock': 500},
        {'name': 'Saus Keju', 'unit': 'gram', 'min_stock': 500},
        {'name': 'Chili Oil', 'unit': 'ml', 'min_stock': 1000},
        {'name': 'Mayonnaise', 'unit': 'ml', 'min_stock': 1000},
    ]

    ingredients = {}
    for data in ingredients_data:
        ing, created = Ingredient.objects.get_or_create(
            name=data['name'],
            defaults={
                'unit': data['unit'],
                'min_stock_alert': data['min_stock'],
                'current_stock': 0 # HQ Stock or default
            }
        )
        ingredients[data['name']] = ing
        if created:
            print(f"Created Ingredient: {ing.name}")
        else:
            print(f"Verified Ingredient: {ing.name}")

    # 2. Map Products to Ingredients (Recipes)
    # Format: Product Name -> List of (Ingredient Name, Quantity)
    recipe_map = {
        # DIMSUM
        'Dimsum - Paket Single': [('Dimsum Ayam Beku', 3)],
        'Dimsum - Paket Bareng': [('Dimsum Ayam Beku', 7)],
        'Dimsum Mentai': [('Dimsum Ayam Beku', 6), ('Saus Mentai', 20)], # 20g sauce
        
        # GYOZA
        'Gyoza Kukus - Paket Single': [('Gyoza Ayam Beku', 4)],
        'Gyoza Goreng - Paket Single': [('Gyoza Ayam Beku', 4)], # Same ingredient, assumes frying oil is not tracked per portion rigorously or tracked separately
        'Gyoza Kukus - Paket Bareng': [('Gyoza Ayam Beku', 10)],
        'Gyoza Goreng - Paket Bareng': [('Gyoza Ayam Beku', 10)],
        'Gyoza Mentai': [('Gyoza Ayam Beku', 7), ('Saus Mentai', 25)],

        # WONTON
        'Wonton Kuah': [('Wonton Ayam Beku', 8)],
        'Wonton Goreng': [('Wonton Ayam Beku', 8)],
    }

    print("\nCreating Recipes...")
    for product_name, items in recipe_map.items():
        try:
            product = Product.objects.get(name__icontains=product_name)
            
            # Create or Get Recipe
            recipe, created = Recipe.objects.get_or_create(
                product=product,
                defaults={'notes': f'Standard recipe for {product.name}'}
            )

            # Clear existing items to avoid duplicates if re-running
            if not created:
                recipe.items.all().delete()
                print(f"Updated recipe for: {product.name}")
            else:
                print(f"Created recipe for: {product.name}")

            # Add Items
            for ing_name, qty in items:
                ingredient = ingredients.get(ing_name)
                if ingredient:
                    RecipeItem.objects.create(
                        recipe=recipe,
                        ingredient=ingredient,
                        quantity_required=Decimal(qty)
                    )
                else:
                    print(f"WARNING: Ingredient {ing_name} not found for {product.name}")

            print(f"WARNING: Product '{product_name}' not found. Skipping.")
        except Product.MultipleObjectsReturned:
             print(f"WARNING: Multiple products found for '{product_name}'. Skipping.")

    # 3. Seed Modifiers (Toppings)
    print("\nSeeding Modifiers...")
    
    # Create Group "Topping Tambahan"
    topping_group, created = ModifierGroup.objects.get_or_create(
        name="Topping Tambahan",
        defaults={'min_selection': 0, 'max_selection': 5}
    )
    
    # Link to All Dimsum/Gyoza/Wonton Products
    products = Product.objects.filter(category__name__in=['Dimsum', 'Gyoza', 'Wonton'])
    for p in products:
        topping_group.products.add(p)
    print(f"Linked 'Topping Tambahan' to {products.count()} products.")

    # Define Options and their Ingredient Links
    modifier_data = [
        {'name': 'Extra Saus Mentai', 'price': 3000, 'ingredient': 'Saus Mentai', 'qty': 20},
        {'name': 'Extra Saus Keju', 'price': 3000, 'ingredient': 'Saus Keju', 'qty': 20},
        {'name': 'Extra Chili Oil', 'price': 2000, 'ingredient': 'Chili Oil', 'qty': 15},
        {'name': 'Extra Mayonnaise', 'price': 1000, 'ingredient': 'Mayonnaise', 'qty': 15},
    ]

    for mod in modifier_data:
        ingredient = ingredients.get(mod['ingredient'])
        if not ingredient:
            print(f"Skipping {mod['name']}, ingredient {mod['ingredient']} not found.")
            continue
            
        option, created = ModifierOption.objects.get_or_create(
            group=topping_group,
            name=mod['name'],
            defaults={
                'price_adjustment': mod['price'],
                'ingredient': ingredient,
                'quantity_required': mod['qty']
            }
        )
        if not created:
            # Update links if they didn't exist
            option.ingredient = ingredient
            option.quantity_required = mod['qty']
            option.save()
            print(f"Updated Modifier: {option.name}")
        else:
            print(f"Created Modifier: {option.name}")

    # 4. Seed Mitra Stock (Based on Package)
    # Eksekutif: 450 total (150 Dimsum, 150 Gyoza, 150 Wonton)
    # Eksklusif: 900 total (300 Dimsum, 300 Gyoza, 300 Wonton)
    print("\nSeeding Mitra Stock...")

    mitras = Mitra.objects.all()
    for mitra in mitras:
        user = mitra.user
        # Get active subscription
        sub = Subscription.objects.filter(user=user, status='active').order_by('-created_at').first()
        if not sub:
            print(f"Skipping {user.username}: No active subscription found.")
            continue
        
        plan = sub.plan_name.lower()
        print(f"Processing {user.username} (Plan: {sub.plan_name})")

        # Determine Stock Levels
        stock_qty = 0
        if 'eksekutif' in plan:
            stock_qty = 150 # 450 total / 3 types
            sauce_qty = 1000 # 1kg sauce
            oil_qty = 1000 # 1L oil
        elif 'eksklusif' in plan:
            stock_qty = 300 # 900 total / 3 types
            sauce_qty = 2000 # 2kg
            oil_qty = 2000 # 2L
        else:
            print(f"Unknown plan for {user.username}, setting default low stock.")
            stock_qty = 10
            sauce_qty = 100
            oil_qty = 100

        # Define category mapping to ingredient name
        # We need to map product categories to ingredients.
        # Mapping: 
        # Dimsum -> 'Dimsum Ayam Beku'
        # Gyoza -> 'Gyoza Ayam Beku'
        # Wonton -> 'Wonton Ayam Beku'
        
        stock_mapping = {
            'Dimsum Ayam Beku': stock_qty,
            'Gyoza Ayam Beku': stock_qty,
            'Wonton Ayam Beku': stock_qty,
            'Saus Mentai': sauce_qty,
            'Saus Keju': sauce_qty,
            'Chili Oil': oil_qty,
            'Mayonnaise': oil_qty
        }

        for ing_name, qty in stock_mapping.items():
            ingredient = ingredients.get(ing_name)
            if not ingredient:
                continue
            
            stock, created = IngredientStock.objects.get_or_create(
                mitra=mitra,
                ingredient=ingredient,
                defaults={
                    'current_stock': qty,
                    'min_stock_alert': 10 # Default alert
                }
            )
            if not created:
                stock.current_stock = qty
                stock.save()
            
        print(f"  -> Stock updated for {user.username}")

    print("\nInventory Seeding Completed!")

if __name__ == '__main__':
    seed_inventory()
