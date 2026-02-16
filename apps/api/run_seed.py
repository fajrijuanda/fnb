import sys
import os

# Add apps/api to path if not there (though manage.py shell should handle it)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

try:
    import seed_users
    import seed_products
    import seed_inventory
    import seed_modifiers_varian

    print("--- Running seed_users ---")
    seed_users.create_users()
    
    print("--- Running seed_products ---")
    seed_products.seed_products()
    
    print("--- Running seed_inventory ---")
    seed_inventory.seed_inventory()
    
    print("--- Running seed_modifiers_varian ---")
    seed_modifiers_varian.seed_varian_topping()
except Exception:
    import traceback
    with open('seed_error.log', 'w') as f:
        traceback.print_exc(file=f)
    print("Seed execution failed. Check seed_error.log")
