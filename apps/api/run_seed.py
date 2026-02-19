import sys
import os
import hashlib
import django

# Add apps/api to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, '../../')) # Add project root

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import SeederLog

def get_file_checksum(filepath):
    """Calculates SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def run_seeder(name, seed_func, filepath):
    """Runs a seeder only if the file has changed."""
    print(f"--- Checking {name} ---")
    
    try:
        current_checksum = get_file_checksum(filepath)
        
        # Check if already executed with same checksum
        log, created = SeederLog.objects.get_or_create(name=name)
        
        if not created and log.checksum == current_checksum:
            print(f"  [SKIPPED] {name} already up to date.")
            return

        print(f"  [RUNNING] {name}...")
        seed_func()
        
        # Update log
        log.checksum = current_checksum
        log.save()
        print(f"  [SUCCESS] {name} completed and logged.")
        
    except Exception as e:
        print(f"  [FAILED] {name}: {e}")
        raise e

try:
    import seed_users
    import seed_products
    import seed_inventory
    import seed_modifiers_varian

    run_seeder('seed_users', seed_users.create_users, seed_users.__file__)
    run_seeder('seed_products', seed_products.seed_products, seed_products.__file__)
    run_seeder('seed_inventory', seed_inventory.seed_inventory, seed_inventory.__file__)
    run_seeder('seed_modifiers_varian', seed_modifiers_varian.seed_varian_topping, seed_modifiers_varian.__file__)

except Exception:
    import traceback
    with open('seed_error.log', 'w') as f:
        traceback.print_exc()
    print("Seed execution failed. Check seed_error.log")
    traceback.print_exc()
