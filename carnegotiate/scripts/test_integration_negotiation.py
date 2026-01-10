import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_full_negotiation():
    print("=== FULL NEGOTIATION FLOW TEST ===")
    
    # Login both
    r_b = requests.post(f"{BASE_URL}/auth/login/", json={"email": "buyer@test.com", "password": "pass1234"})
    buyer_token = r_b.json().get("access")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    r_d = requests.post(f"{BASE_URL}/auth/login/", json={"email": "dealer@test.com", "password": "pass1234"})
    dealer_token = r_d.json().get("access")
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}
    
    print("✅ Logged in both users")
    
    # Browse to find vehicle
    r = requests.get(f"{BASE_URL}/vehicles/")
    vehicle = r.json().get('results')[0]
    vid = vehicle['id']
    price = float(vehicle.get('asking_price') or 30000)
    print(f"Vehicle: {vehicle['make']} {vehicle['model']} (${price})")
    
    # Buyer makes Offer
    print("\n--- Buyer Makes Offer ---")
    offer1 = price * 0.9
    r = requests.post(f"{BASE_URL}/negotiations/", json={
        "vehicle_id": vid, "initial_amount": offer1, "message": "Test"
    }, headers=buyer_headers)
    
    neg_id = None
    if r.status_code == 201:
        neg_id = r.json().get('id')
        print(f"✅ Offer 1 sent: {neg_id}")
    elif r.status_code == 400:
        # Check if exists
         print("Offer exists, finding it...")
         r_list = requests.get(f"{BASE_URL}/negotiations/", headers=buyer_headers)
         for n in r_list.json().get('results', []):
             if n.get('vehicle', {}).get('id') == vid or str(n.get('vehicle')) == vid:
                 neg_id = n['id']
                 break
    
    if not neg_id:
        print("❌ Could not get negotiation ID")
        return

    # Dealer Counters
    print("\n--- Dealer Counters ---")
    counter = price * 0.95
    r = requests.post(f"{BASE_URL}/negotiations/{neg_id}/submit-offer/", json={
        "amount": counter, "message": "Counter"
    }, headers=dealer_headers)
    if r.status_code in [200, 201]:
        print("✅ Counter sent")
    else:
        print(f"❌ Counter failed: {r.text}")
        
    # Buyer Accepts
    print("\n--- Buyer Accepts ---")
    r = requests.post(f"{BASE_URL}/negotiations/{neg_id}/accept/", json={"confirm": True}, headers=buyer_headers)
    if r.status_code == 200:
        print("✅ Accepted")
    else:
         if "already" in r.text:
             print("✅ Already accepted")
         else:
             print(f"❌ Accept failed: {r.text}")

    print("\n=== FLOW COMPLETE ===")

if __name__ == "__main__":
    test_full_negotiation()
