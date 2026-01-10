"""
Complete Workflow Test Suite - All Roles
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    symbols = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"{symbols.get(status, 'ℹ️')} {msg}")
    sys.stdout.flush()

def test_service_health():
    print("\n" + "="*60)
    print("  SERVICE HEALTH CHECK")
    print("="*60)
    
    # Backend
    try:
        r = requests.get(f"{BASE_URL}/vehicles/", timeout=5)
        if r.status_code == 200:
            log("Backend API: HEALTHY", "PASS")
        else:
            log(f"Backend API: HTTP {r.status_code}", "FAIL")
            return False
    except Exception as e:
        log(f"Backend API: OFFLINE - {e}", "FAIL")
        return False
    
    # Frontend
    try:
        r = requests.get(f"{FRONTEND_URL}/", timeout=5)
        if r.status_code == 200:
            log("Frontend: HEALTHY", "PASS")
        else:
            log(f"Frontend: HTTP {r.status_code}", "WARN")
    except Exception as e:
        log(f"Frontend: OFFLINE - {e}", "FAIL")
    
    return True

def test_buyer_scenarios():
    print("\n" + "="*60)
    print("  BUYER WORKFLOW SCENARIOS")
    print("="*60)
    issues = []
    
    # Scenario 1: Browse Vehicles
    print("\n--- Scenario 1: Browse & Search ---")
    r = requests.get(f"{BASE_URL}/vehicles/")
    vehicles = r.json().get('results', [])
    if vehicles:
        log(f"Found {len(vehicles)} vehicles", "PASS")
        vid = vehicles[0]['id']
        price = float(vehicles[0].get('asking_price', 30000))
    else:
        log("No vehicles found", "FAIL")
        issues.append("No vehicles in database")
        return issues
    
    # Scenario 2: Login
    print("\n--- Scenario 2: Login ---")
    r = requests.post(f"{BASE_URL}/auth/login/", json={"email": "buyer@test.com", "password": "pass1234"})
    if r.status_code == 200:
        token = r.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        log("Buyer login successful", "PASS")
    else:
        log(f"Login failed: {r.status_code}", "FAIL")
        issues.append("Buyer login failed")
        return issues
    
    # Scenario 3: Make Offer
    print("\n--- Scenario 3: Make Offer ---")
    offer = price * 0.85
    r = requests.post(f"{BASE_URL}/negotiations/", json={
        "vehicle_id": vid, "initial_amount": offer, "message": "Test"
    }, headers=headers)
    if r.status_code == 201:
        log(f"Offer created: ${offer:.0f}", "PASS")
    elif r.status_code == 400:
        log("Offer exists or validation issue", "WARN")
    else:
        log(f"Offer failed: {r.status_code}", "FAIL")
        issues.append(f"Offer failed: {r.text[:50]}")
    
    # Scenario 4: View Dashboard
    print("\n--- Scenario 4: Dashboard ---")
    r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
    if r.status_code == 200:
        log(f"Negotiations loaded: {len(r.json().get('results', []))}", "PASS")
    else:
        log(f"Dashboard failed: {r.status_code}", "FAIL")
        issues.append("Dashboard failed")
    
    return issues

def test_dealer_scenarios():
    print("\n" + "="*60)
    print("  DEALER WORKFLOW SCENARIOS")
    print("="*60)
    issues = []
    
    # Scenario 1: Login
    print("\n--- Scenario 1: Login ---")
    r = requests.post(f"{BASE_URL}/auth/login/", json={"email": "dealer@test.com", "password": "pass1234"})
    if r.status_code == 200:
        token = r.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        log("Dealer login successful", "PASS")
    else:
        log(f"Login failed: {r.status_code}", "FAIL")
        issues.append("Dealer login failed")
        return issues
    
    # Scenario 2: View Profile & Stats
    print("\n--- Scenario 2: Profile & Stats ---")
    r = requests.get(f"{BASE_URL}/dealers/me/", headers=headers)
    if r.status_code == 200:
        log(f"Profile: {r.json().get('business_name', 'N/A')}", "PASS")
    else:
        log(f"Profile failed: {r.status_code}", "FAIL")
        issues.append("Dealer profile failed")
    
    r = requests.get(f"{BASE_URL}/dealers/stats/", headers=headers)
    if r.status_code == 200:
        log("Stats loaded", "PASS")
    else:
        log(f"Stats failed: {r.status_code}", "FAIL")
        issues.append("Dealer stats failed")
    
    # Scenario 3: Inventory
    print("\n--- Scenario 3: Inventory ---")
    r = requests.get(f"{BASE_URL}/vehicles/my_inventory/", headers=headers)
    if r.status_code == 200:
        log(f"Inventory: {len(r.json().get('results', []))} vehicles", "PASS")
    else:
        log(f"Inventory failed: {r.status_code}", "FAIL")
        issues.append("Inventory failed")
    
    # Scenario 4: Add Vehicle
    print("\n--- Scenario 4: Add Vehicle ---")
    vin = f"TEST{int(time.time()) % 10000000000}123"
    r = requests.post(f"{BASE_URL}/vehicles/", json={
        "vin": vin, "stock_number": vin[-8:], "make": "Test", "model": "Model",
        "year": 2025, "body_type": "sedan", "exterior_color": "White",
        "interior_color": "Black", "asking_price": 35000, "msrp": 38000, "floor_price": 33000,
        "specifications": {"mileage": 100}, "status": "active"
    }, headers=headers)
    if r.status_code == 201:
        log("Vehicle created", "PASS")
    else:
        log(f"Create failed: {r.text[:80]}", "FAIL")
        issues.append(f"Vehicle creation failed")
    
    # Scenario 5: View Offers
    print("\n--- Scenario 5: View Offers ---")
    r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
    if r.status_code == 200:
        log(f"Offers: {len(r.json().get('results', []))}", "PASS")
    else:
        log(f"Offers failed: {r.status_code}", "FAIL")
        issues.append("Offers failed")
    
    return issues

def test_admin_scenarios():
    print("\n" + "="*60)
    print("  ADMIN WORKFLOW SCENARIOS")
    print("="*60)
    issues = []
    
    # Scenario 1: Login
    print("\n--- Scenario 1: Login ---")
    creds = [("admin@test.com", "admin1234"), ("admin@carnegotiate.com", "admin")]
    token = None
    for email, pwd in creds:
        r = requests.post(f"{BASE_URL}/auth/login/", json={"email": email, "password": pwd})
        if r.status_code == 200:
            token = r.json().get('access')
            log(f"Admin login: {email}", "PASS")
            break
    
    if not token:
        log("Admin login failed with all credentials", "FAIL")
        issues.append("Admin login failed")
        return issues
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Scenario 2: Profile
    print("\n--- Scenario 2: Profile ---")
    r = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    if r.status_code == 200:
        profile = r.json()
        log(f"Type: {profile.get('user_type', 'unknown')}", "PASS")
    else:
        log(f"Profile failed: {r.status_code}", "FAIL")
        issues.append("Admin profile failed")
    
    # Scenario 3: Django Admin
    print("\n--- Scenario 3: Django Admin ---")
    r = requests.get("http://localhost:8000/admin/", allow_redirects=False)
    if r.status_code in [200, 302]:
        log(f"Django Admin: HTTP {r.status_code}", "PASS")
    else:
        log(f"Django Admin: HTTP {r.status_code}", "FAIL")
        issues.append("Django Admin not accessible")
    
    return issues

def main():
    print("\n" + "#"*60)
    print("  CARNEGOTIATE WORKFLOW TEST SUITE")
    print("#"*60)
    
    if not test_service_health():
        print("\n❌ SERVICES OFFLINE - Cannot proceed with tests")
        return
    
    all_issues = []
    
    buyer_issues = test_buyer_scenarios()
    all_issues.extend([f"BUYER: {i}" for i in buyer_issues])
    
    dealer_issues = test_dealer_scenarios()
    all_issues.extend([f"DEALER: {i}" for i in dealer_issues])
    
    admin_issues = test_admin_scenarios()
    all_issues.extend([f"ADMIN: {i}" for i in admin_issues])
    
    print("\n" + "#"*60)
    print("  FINAL SUMMARY")
    print("#"*60)
    
    if all_issues:
        print(f"\n❌ FOUND {len(all_issues)} ISSUES:")
        for i, issue in enumerate(all_issues, 1):
            print(f"   {i}. {issue}")
    else:
        print("\n✅ ALL WORKFLOW TESTS PASSED!")

if __name__ == "__main__":
    main()
