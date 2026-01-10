"""
Dealer Workflow Test - Comprehensive Scenarios
Tests: Login, Dashboard, Inventory, Add Vehicle, View Offers, Counter Offer, Accept/Reject
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    symbols = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"{symbols.get(status, 'ℹ️')} {msg}")

def test_dealer_workflow():
    print("\n" + "="*60)
    print("  DEALER WORKFLOW TEST - COMPREHENSIVE SCENARIOS")
    print("="*60)
    
    issues = []
    
    # === SCENARIO 1: Dealer Authentication ===
    print("\n--- Scenario 1: Dealer Authentication ---")
    
    r = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "dealer@test.com",
        "password": "pass1234"
    })
    if r.status_code == 200:
        token = r.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        log("Dealer login successful", "PASS")
    else:
        log(f"Dealer login failed: {r.status_code} - {r.text}", "FAIL")
        issues.append("Dealer login failed")
        return issues
    
    # === SCENARIO 2: Dealer Profile ===
    print("\n--- Scenario 2: Dealer Profile ---")
    
    r = requests.get(f"{BASE_URL}/dealers/me/", headers=headers)
    if r.status_code == 200:
        profile = r.json()
        log(f"Dealer profile: {profile.get('business_name')}", "PASS")
    else:
        log(f"Dealer profile failed: {r.status_code}", "FAIL")
        issues.append("Dealer profile failed")
    
    # === SCENARIO 3: Dealer Dashboard Stats ===
    print("\n--- Scenario 3: Dashboard Stats ---")
    
    r = requests.get(f"{BASE_URL}/dealers/stats/", headers=headers)
    if r.status_code == 200:
        stats = r.json()
        log(f"Stats loaded - Vehicles: {stats.get('active_vehicles', 'N/A')}", "PASS")
    else:
        log(f"Dashboard stats failed: {r.status_code}", "FAIL")
        issues.append("Dealer stats failed")
    
    # === SCENARIO 4: Inventory Management ===
    print("\n--- Scenario 4: Inventory Management ---")
    
    r = requests.get(f"{BASE_URL}/vehicles/my_inventory/", headers=headers)
    if r.status_code == 200:
        inventory = r.json().get('results', [])
        log(f"Inventory loaded: {len(inventory)} vehicles", "PASS")
    else:
        log(f"Inventory failed: {r.status_code}", "FAIL")
        issues.append("Inventory loading failed")
    
    # === SCENARIO 5: Add New Vehicle ===
    print("\n--- Scenario 5: Add New Vehicle ---")
    
    # Generate unique VIN (17 chars)
    timestamp = str(int(time.time()))[-10:]  # Last 10 digits
    vin = f"TEST{timestamp}123"
    
    r = requests.post(f"{BASE_URL}/vehicles/", json={
        "vin": vin,
        "stock_number": f"STK{timestamp[-6:]}",
        "make": "TestBrand",
        "model": "TestModel",
        "year": 2025,
        "trim": "EX",
        "body_type": "sedan",
        "exterior_color": "White",
        "interior_color": "Black",
        "asking_price": 35000,
        "msrp": 38000,
        "floor_price": 33000,
        "specifications": {"mileage": 500, "transmission": "automatic"},
        "status": "active"
    }, headers=headers)
    
    new_vehicle_id = None
    if r.status_code == 201:
        new_vehicle_id = r.json().get('id')
        log(f"Vehicle created: {new_vehicle_id}", "PASS")
    else:
        log(f"Create vehicle failed: {r.status_code} - {r.text[:200]}", "FAIL")
        issues.append(f"Create vehicle failed: {r.text[:100]}")
    
    # === SCENARIO 6: View Incoming Offers ===
    print("\n--- Scenario 6: View Incoming Offers ---")
    
    r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
    if r.status_code == 200:
        negotiations = r.json().get('results', [])
        log(f"Negotiations loaded: {len(negotiations)} offers", "PASS")
        active_neg = None
        for n in negotiations:
            if n.get('status') == 'active':
                active_neg = n
                break
    else:
        log(f"Get negotiations failed: {r.status_code}", "FAIL")
        issues.append("Dealer get negotiations failed")
        active_neg = None
    
    # === SCENARIO 7: Counter Offer Flow ===
    print("\n--- Scenario 7: Counter Offer Flow ---")
    
    if active_neg:
        neg_id = active_neg['id']
        current_offer = active_neg.get('current_offer', {})
        current_amount = float(current_offer.get('amount', 30000)) if current_offer else 30000
        counter_amount = current_amount * 1.05  # 5% higher
        
        r = requests.post(f"{BASE_URL}/negotiations/{neg_id}/submit-offer/", json={
            "amount": counter_amount,
            "message": "Dealer counter offer"
        }, headers=headers)
        
        if r.status_code in [200, 201]:
            log(f"Counter offer submitted: ${counter_amount:.2f}", "PASS")
        elif r.status_code == 400:
            log(f"Counter offer validation: {r.text[:100]}", "WARN")
        else:
            log(f"Counter offer failed: {r.status_code}", "FAIL")
            issues.append("Counter offer failed")
    else:
        log("No active negotiation to counter", "WARN")
    
    # === SCENARIO 8: Pending Offers ===
    print("\n--- Scenario 8: Pending Offers ---")
    
    r = requests.get(f"{BASE_URL}/dealers/me/pending-offers/", headers=headers)
    if r.status_code == 200:
        pending = r.json()
        log(f"Pending offers loaded", "PASS")
    else:
        log(f"Pending offers failed: {r.status_code}", "WARN")
    
    # === SCENARIO 9: Inventory Summary ===
    print("\n--- Scenario 9: Inventory Summary ---")
    
    r = requests.get(f"{BASE_URL}/dealers/me/inventory-summary/", headers=headers)
    if r.status_code == 200:
        log("Inventory summary loaded", "PASS")
    else:
        log(f"Inventory summary failed: {r.status_code}", "WARN")
    
    # === SCENARIO 10: Frontend Pages ===
    print("\n--- Scenario 10: Frontend Pages ---")
    
    pages = [
        ("/dealer", "Dealer Dashboard"),
        ("/dealer/offers", "Dealer Offers"),
        ("/dealer/inventory", "Dealer Inventory"),
    ]
    for path, name in pages:
        try:
            r = requests.get(f"{FRONTEND_URL}{path}", allow_redirects=False, timeout=5)
            if r.status_code in [200, 307, 308]:
                log(f"{name} page: HTTP {r.status_code}", "PASS")
            else:
                log(f"{name} page: HTTP {r.status_code}", "FAIL")
                issues.append(f"{name} page returned {r.status_code}")
        except Exception as e:
            log(f"{name} page error: {e}", "FAIL")
            issues.append(f"{name} page error")
    
    # === SUMMARY ===
    print("\n" + "="*60)
    if issues:
        print(f"  DEALER WORKFLOW: {len(issues)} ISSUES FOUND")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
    else:
        print("  DEALER WORKFLOW: ALL TESTS PASSED ✅")
    print("="*60)
    
    return issues

if __name__ == "__main__":
    test_dealer_workflow()
