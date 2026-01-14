import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_dealer_journey():
    print("=== DEALER JOURNEY INTEGRATION TEST ===")
    
    # 1. Login
    print("\n--- Step 1: Login ---")
    payload = {"email": "dealer@test.com", "password": "pass1234"}
    r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    if r.status_code != 200:
        print(f"❌ Login Failed: {r.status_code}")
        return
    token = r.json().get("access")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in")

    # 2. Profile
    print("\n--- Step 2: Profile ---")
    r = requests.get(f"{BASE_URL}/dealers/me/", headers=headers) # FIXED URL
    if r.status_code == 200:
        print("✅ Profile loaded")
    else:
        print(f"❌ Profile failed: {r.status_code}")

    # 3. Stats
    print("\n--- Step 3: Stats ---")
    r = requests.get(f"{BASE_URL}/dealers/stats/", headers=headers)
    if r.status_code == 200:
        print("✅ Stats loaded")
    else:
        print(f"❌ Stats failed: {r.status_code}")

    # 4. Inventory
    print("\n--- Step 4: Inventory ---")
    r = requests.get(f"{BASE_URL}/vehicles/my_inventory/", headers=headers)
    if r.status_code == 200:
        print(f"✅ Inventory loaded ({len(r.json().get('results', []))} vehicles)")
    else:
        print(f"❌ Inventory failed: {r.status_code}")

    # 5. Add Vehicle
    print("\n--- Step 5: Add Vehicle ---")
    # VIN must be 17 chars. TEST (4) + Time (10) + 123 (3) = 17
    vin = f"TEST{int(time.time())}123"
    payload = {
        "vin": vin,
        "make": "TestMake",
        "model": "TestModel",
        "year": 2025,
        "price": 35000, # Serializer might need asking_price
        "asking_price": 35000,
        "msrp": 38000,
        "floor_price": 34000,
        "mileage": 100,
        "status": "draft",
        # Required fields check
        "body_type": "sedan",
        "exterior_color": "Black",
        "interior_color": "Black",
        "stock_number": vin[-8:]
    }
    r = requests.post(f"{BASE_URL}/vehicles/", json=payload, headers=headers)
    if r.status_code == 201:
        print(f"✅ Vehicle created: {r.json().get('id')}")
    else:
        print(f"❌ Vehicle Create Failed: {r.text}")

    print("\n=== DEALER JOURNEY COMPLETE ===")

if __name__ == "__main__":
    test_dealer_journey()
