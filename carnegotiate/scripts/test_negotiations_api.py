import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def get_token(role):
    # email = buyer@test.com / dealer@test.com
    email = "buyer@test.com" if role == "buyer" else "dealer@test.com"
    payload = {"email": email, "password": "pass1234"}
    r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    if r.status_code == 200:
        return r.json().get("access")
    return None

def test_negotiations():
    print("=== SETUP: Get Tokens ===")
    buyer_token = get_token("buyer")
    dealer_token = get_token("dealer")
    if not buyer_token or not dealer_token:
        print("❌ FAIL - Could not get tokens")
        return

    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    print("✅ TOKENS RECEIVED")

    # Need a vehicle to negotiate on.
    # Get random vehicle
    print("\n=== SETUP: Get Vehicle ===")
    r = requests.get(f"{BASE_URL}/vehicles/")
    results = r.json().get('results', [])
    if not results:
        print("❌ FAIL - No vehicles found")
        return
    vehicle_id = results[0]['id']
    vehicle_price = float(results[0].get('asking_price', 30000))
    print(f"✅ Selected Vehicle: {vehicle_id} (${vehicle_price})")

    print("\n=== TEST: Create Negotiation (Make Offer) ===")
    offer_amount = vehicle_price * 0.9
    payload = {
        "vehicle_id": vehicle_id,
        "initial_amount": offer_amount,
        "message": "Test offer"
    }
    neg_id = None
    r = requests.post(f"{BASE_URL}/negotiations/", json=payload, headers=buyer_headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 201:
        print("✅ PASS - Negotiation created")
        neg_id = r.json().get('id')
    elif r.status_code == 400 and "already exists" in r.text:
        print("⚠️ Negotiation likely already exists, finding it...")
        # Find existing
        r2 = requests.get(f"{BASE_URL}/negotiations/", headers=buyer_headers)
        for n in r2.json().get('results', []):
            if str(n.get('vehicle')) == str(vehicle_id) or n.get('vehicle_data', {}).get('id') == vehicle_id:
                neg_id = n['id']
                print(f"✅ Found existing negotiation: {neg_id}")
                break
    else:
        print(f"❌ FAIL - {r.text}")

    if not neg_id:
        print("❌ CRITICAL: No negotiation ID, cannot proceed")
        return

    print("\n=== TEST: List Negotiations (Buyer) ===")
    r = requests.get(f"{BASE_URL}/negotiations/", headers=buyer_headers)
    if r.status_code == 200 and len(r.json().get('results', [])) > 0:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: List Negotiations (Dealer) ===")
    r = requests.get(f"{BASE_URL}/negotiations/", headers=dealer_headers)
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: Get Single Negotiation ===")
    r = requests.get(f"{BASE_URL}/negotiations/{neg_id}/", headers=buyer_headers)
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: Dealer Counter Offer ===")
    counter_amount = vehicle_price * 0.95
    payload = {
        "amount": counter_amount,
        "message": "Counter offer from dealer"
    }
    r = requests.post(f"{BASE_URL}/negotiations/{neg_id}/submit-offer/", json=payload, headers=dealer_headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200 or r.status_code == 201:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.text}")

    # Verify Buyer sees counter
    # ... skipped specific check, assuming pass if 200

    print("\n=== TEST: Buyer Accept Offer ===")
    r = requests.post(f"{BASE_URL}/negotiations/{neg_id}/accept/", json={"confirm": True}, headers=buyer_headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("✅ PASS")
    elif r.status_code == 400 and "already" in r.text:
         print("⚠️ Already accepted")
    else:
        print(f"❌ FAIL - {r.text}")

    print("\n=== TEST: Negotiation Stats ===")
    r = requests.get(f"{BASE_URL}/negotiations/stats/", headers=buyer_headers)
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

if __name__ == "__main__":
    test_negotiations()
