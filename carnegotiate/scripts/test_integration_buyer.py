import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_buyer_journey():
    print("=== BUYER JOURNEY INTEGRATION TEST ===")
    
    # 1. Login
    print("\n--- Step 1: Login ---")
    payload = {"email": "buyer@test.com", "password": "pass1234"}
    r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    if r.status_code != 200:
        print(f"❌ Login Failed: {r.status_code}")
        return
    token = r.json().get("access")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in")

    # 2. Browse Vehicles
    print("\n--- Step 2: Browse Vehicles ---")
    r = requests.get(f"{BASE_URL}/vehicles/")
    if r.status_code != 200 or not r.json().get('results'):
        print("❌ No vehicles found")
        return
    results = r.json().get('results')
    print(f"✅ Found {len(results)} vehicles")
    
    # Select first vehicle
    vehicle = results[0]
    vid = vehicle['id']
    price = float(vehicle.get('asking_price') or vehicle.get('price') or 30000)
    print(f"Selected: {vehicle['make']} {vehicle['model']} (${price})")

    # 3. View Details
    print("\n--- Step 3: View Details ---")
    r = requests.get(f"{BASE_URL}/vehicles/{vid}/")
    if r.status_code == 200:
        print("✅ Details loaded")
    else:
        print(f"❌ Details failed: {r.status_code}")

    # 4. Save Vehicle
    print("\n--- Step 4: Save Vehicle ---")
    r = requests.post(f"{BASE_URL}/vehicles/saved/", json={"vehicle_id": vid}, headers=headers)
    if r.status_code in [201, 200]: # 200 if already saved?
        print("✅ Saved")
    else:
        # Check if error is "already saved" which returns 400 often in DRF validation
        if "already" in r.text or "unique" in r.text:
             print("✅ Already saved")
        else:
             print(f"⚠️ Save failed or already saved: {r.status_code} {r.text}")

    # 5. Make Offer
    print("\n--- Step 5: Make Offer ---")
    offer = price * 0.95
    payload = {
        "vehicle_id": vid,
        "initial_amount": offer,
        "message": "Integration test offer"
    }
    r = requests.post(f"{BASE_URL}/negotiations/", json=payload, headers=headers)
    neg_id = None
    if r.status_code == 201:
        neg_id = r.json().get("id")
        print(f"✅ Offer submitted: {neg_id}")
    elif r.status_code == 400 and "already exists" in r.text:
        print("✅ Offer already exists")
        # Find it
        r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
        for n in r.json().get('results', []):
             if n.get('vehicle', {}).get('id') == vid or str(n.get('vehicle')) == vid: # Serializer might return object or ID
                 neg_id = n['id']
                 break
    else:
        print(f"❌ Offer Failed: {r.status_code} {r.text}")

    # 6. Check Dashboard (Negotiations List)
    print("\n--- Step 6: Check Dashboard ---")
    r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
    if r.status_code == 200:
        print(f"✅ Dashboard loaded ({len(r.json().get('results', []))} negotiations)")
    else:
        print(f"❌ Dashboard failed: {r.status_code}")

    print("\n=== BUYER JOURNEY COMPLETE ===")

if __name__ == "__main__":
    test_buyer_journey()
