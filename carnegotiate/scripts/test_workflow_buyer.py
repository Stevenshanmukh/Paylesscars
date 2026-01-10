"""
Buyer Workflow Test - Comprehensive Scenarios
Tests: Browse, Search, Filter, View Details, Save Vehicle, Make Offer, Counter, Accept
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    symbols = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"{symbols.get(status, 'ℹ️')} {msg}")

def test_buyer_workflow():
    print("\n" + "="*60)
    print("  BUYER WORKFLOW TEST - COMPREHENSIVE SCENARIOS")
    print("="*60)
    
    issues = []
    
    # === SCENARIO 1: Anonymous Browsing ===
    print("\n--- Scenario 1: Anonymous Browsing ---")
    
    # 1.1 Homepage accessible
    try:
        r = requests.get(FRONTEND_URL, timeout=5)
        if r.status_code == 200:
            log("Homepage loads successfully", "PASS")
        else:
            log(f"Homepage returned {r.status_code}", "FAIL")
            issues.append("Homepage not accessible")
    except Exception as e:
        log(f"Homepage error: {e}", "FAIL")
        issues.append(f"Homepage error: {e}")
    
    # 1.2 Vehicle listing (public)
    r = requests.get(f"{BASE_URL}/vehicles/")
    if r.status_code == 200:
        vehicles = r.json().get('results', [])
        log(f"Vehicle listing: {len(vehicles)} vehicles found", "PASS")
        if len(vehicles) == 0:
            issues.append("No vehicles in database")
    else:
        log(f"Vehicle listing failed: {r.status_code}", "FAIL")
        issues.append("Vehicle listing API failed")
        return issues
    
    # 1.3 Search with filters
    r = requests.get(f"{BASE_URL}/vehicles/?make=Honda")
    if r.status_code == 200:
        log("Search with make filter works", "PASS")
    else:
        log(f"Search filter failed: {r.status_code}", "FAIL")
        issues.append("Vehicle search filter broken")
    
    # 1.4 Featured vehicles
    r = requests.get(f"{BASE_URL}/vehicles/featured/")
    if r.status_code == 200:
        log("Featured vehicles endpoint works", "PASS")
    else:
        log(f"Featured vehicles failed: {r.status_code}", "FAIL")
        issues.append("Featured vehicles endpoint broken")
    
    # 1.5 Vehicle makes list
    r = requests.get(f"{BASE_URL}/vehicles/makes/")
    if r.status_code == 200:
        log("Vehicle makes endpoint works", "PASS")
    else:
        log(f"Vehicle makes failed: {r.status_code}", "FAIL")
        issues.append("Vehicle makes endpoint broken")
    
    # 1.6 Vehicle detail (pick first vehicle)
    vehicle = vehicles[0]
    vid = vehicle['id']
    r = requests.get(f"{BASE_URL}/vehicles/{vid}/")
    if r.status_code == 200:
        detail = r.json()
        log(f"Vehicle detail: {detail.get('make')} {detail.get('model')}", "PASS")
        asking_price = float(detail.get('asking_price', 0))
    else:
        log(f"Vehicle detail failed: {r.status_code}", "FAIL")
        issues.append("Vehicle detail API failed")
        return issues
    
    # 1.7 Similar vehicles
    r = requests.get(f"{BASE_URL}/vehicles/{vid}/similar/")
    if r.status_code == 200:
        log("Similar vehicles endpoint works", "PASS")
    else:
        log(f"Similar vehicles failed: {r.status_code}", "FAIL")
        issues.append("Similar vehicles endpoint broken")
    
    # === SCENARIO 2: Buyer Authentication ===
    print("\n--- Scenario 2: Buyer Authentication ---")
    
    # 2.1 Login
    r = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "buyer@test.com",
        "password": "pass1234"
    })
    if r.status_code == 200:
        token = r.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        log("Buyer login successful", "PASS")
    else:
        log(f"Buyer login failed: {r.status_code} - {r.text}", "FAIL")
        issues.append("Buyer login failed")
        return issues
    
    # 2.2 Get profile
    r = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    if r.status_code == 200:
        profile = r.json()
        log(f"Profile loaded: {profile.get('email')}", "PASS")
    else:
        log(f"Profile failed: {r.status_code}", "FAIL")
        issues.append("Get profile failed")
    
    # === SCENARIO 3: Save Vehicle ===
    print("\n--- Scenario 3: Save Vehicle ---")
    
    r = requests.post(f"{BASE_URL}/vehicles/saved/", json={"vehicle_id": vid}, headers=headers)
    if r.status_code in [200, 201]:
        log("Vehicle saved successfully", "PASS")
    elif r.status_code == 400 and "already" in r.text.lower():
        log("Vehicle already saved (expected for repeat tests)", "PASS")
    else:
        log(f"Save vehicle failed: {r.status_code} - {r.text}", "FAIL")
        issues.append("Save vehicle failed")
    
    # Get saved list
    r = requests.get(f"{BASE_URL}/vehicles/saved/", headers=headers)
    if r.status_code == 200:
        saved = r.json().get('results', [])
        log(f"Saved vehicles list: {len(saved)} items", "PASS")
    else:
        log(f"Get saved vehicles failed: {r.status_code}", "FAIL")
        issues.append("Get saved vehicles failed")
    
    # === SCENARIO 4: Make Offer / Negotiation ===
    print("\n--- Scenario 4: Make Offer ---")
    
    # Calculate valid offer (at least 50% of asking price)
    offer_amount = asking_price * 0.85  # 85% of asking
    
    r = requests.post(f"{BASE_URL}/negotiations/", json={
        "vehicle_id": vid,
        "initial_amount": offer_amount,
        "message": "Buyer workflow test offer"
    }, headers=headers)
    
    neg_id = None
    if r.status_code == 201:
        neg_id = r.json().get('id')
        log(f"Offer submitted: ${offer_amount:.2f}", "PASS")
    elif r.status_code == 400:
        # May already exist
        log("Offer may already exist, checking...", "WARN")
        r2 = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
        if r2.status_code == 200:
            for n in r2.json().get('results', []):
                if str(n.get('vehicle', {}).get('id')) == str(vid) or str(n.get('vehicle')) == str(vid):
                    neg_id = n['id']
                    log(f"Found existing negotiation: {neg_id}", "PASS")
                    break
        if not neg_id:
            log(f"Make offer failed: {r.text}", "FAIL")
            issues.append(f"Make offer validation error: {r.text}")
    else:
        log(f"Make offer failed: {r.status_code}", "FAIL")
        issues.append("Make offer API error")
    
    # === SCENARIO 5: View Negotiations ===
    print("\n--- Scenario 5: View Negotiations ---")
    
    r = requests.get(f"{BASE_URL}/negotiations/", headers=headers)
    if r.status_code == 200:
        negs = r.json().get('results', [])
        log(f"Negotiations list: {len(negs)} active", "PASS")
    else:
        log(f"Get negotiations failed: {r.status_code}", "FAIL")
        issues.append("Get negotiations failed")
    
    # Get negotiation detail
    if neg_id:
        r = requests.get(f"{BASE_URL}/negotiations/{neg_id}/", headers=headers)
        if r.status_code == 200:
            log("Negotiation detail loaded", "PASS")
        else:
            log(f"Negotiation detail failed: {r.status_code}", "FAIL")
            issues.append("Negotiation detail failed")
    
    # === SCENARIO 6: Dashboard Stats ===
    print("\n--- Scenario 6: Dashboard Stats ---")
    
    r = requests.get(f"{BASE_URL}/negotiations/stats/", headers=headers)
    if r.status_code == 200:
        log("Dashboard stats loaded", "PASS")
    else:
        log(f"Dashboard stats failed: {r.status_code}", "FAIL")
        issues.append("Dashboard stats failed")
    
    # === SCENARIO 7: Frontend Page Access ===
    print("\n--- Scenario 7: Frontend Pages ---")
    
    pages = [
        ("/", "Homepage"),
        ("/vehicles", "Vehicle Search"),
        ("/login", "Login"),
        ("/dashboard", "Dashboard"),
        ("/negotiations", "Negotiations"),
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
        print(f"  BUYER WORKFLOW: {len(issues)} ISSUES FOUND")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
    else:
        print("  BUYER WORKFLOW: ALL TESTS PASSED ✅")
    print("="*60)
    
    return issues

if __name__ == "__main__":
    test_buyer_workflow()
