from pywebpush import Vapid
import json

try:
    v = Vapid()
    v.generate_keys()
    
    keys = {
        "private_key": v.private_pem().decode('utf-8'),
        "public_key": v.public_pem().decode('utf-8')
    }
    with open("vapid_keys.json", "w") as f:
        json.dump(keys, f, indent=2)
    print("Keys saved to vapid_keys.json")
    
except Exception as e:
    print(f"Error: {e}")
    # Fallback or debugging
    import inspect
    print(inspect.getmembers(v))
