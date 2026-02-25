import requests

API_URL = "https://api.omden.id/api/v1"
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

# 1. Login
login_data = {"username": "mitra2", "password": "mitra123", "device_id": "test-device", "device_name": "Test Script"}
res = session.post(f"{API_URL}/users/login/", json=login_data)
if res.status_code != 200:
    print(f"Login failed (status {res.status_code}):\n{res.text}")
    print("Headers:", res.headers)
    exit(1)

token = res.json()['access']
user_id = res.json()['user']['id']
headers = {"Authorization": f"Bearer {token}"}

# 2. Get profile
res = session.get(f"{API_URL}/users/{user_id}/", headers=headers)
print("Initial qris_image:", res.json().get('data', res.json()).get('payment_info', {}).get('qris_image'))

# 3. Upload a QRIS using File
try:
    with open("test_qris.png", "rb") as f:
        res = session.patch(f"{API_URL}/users/{user_id}/", headers={"Authorization": f"Bearer {token}"}, files={"qris_image": ("test_qris.png", f, "image/png")})
        print("Upload status:", res.status_code)
except FileNotFoundError:
    print("test_qris.png not found, skipping upload")

res = session.get(f"{API_URL}/users/{user_id}/", headers=headers)
print("After Upload qris_image:", res.json().get('data', res.json()).get('payment_info', {}).get('qris_image'))

# 4. Delete QRIS
patch_data = {"qris_image": ""}
res = session.patch(f"{API_URL}/users/{user_id}/", headers=headers, json=patch_data)
print("Delete status:", res.status_code)
print("Patch response data payment_info:", res.json().get('data', res.json()).get('payment_info'))

# 5. Get profile again
res = session.get(f"{API_URL}/users/{user_id}/", headers=headers)
print("Final qris_image:", res.json().get('data', res.json()).get('payment_info', {}).get('qris_image'))
