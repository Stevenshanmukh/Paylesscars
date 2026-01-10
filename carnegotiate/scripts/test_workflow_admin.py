"""
Admin Workflow Test - Comprehensive Scenarios
Tests: Login, Admin Panel Access, User Management endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_URL = "http://localhost:8000/admin"
FRONTEND_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    symbols = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"{symbols.get(status, 'ℹ️')} {msg}")

def test_admin_workflow():
    print("\n" + "="*60)
    print("  ADMIN WORKFLOW TEST - COMPREHENSIVE SCENARIOS")
    print("="*60)
    
    issues = []
    
    # === SCENARIO 1: Admin Login Attempt ===
    print("\n--- Scenario 1: Admin Authentication ---")
    
    # Try admin credentials from HOW_TO_RUN.md
    admin_creds = [
        ("admin@test.com", "admin1234"),
        ("admin@carnegotiate.com", "admin"),
    ]
    
    token = None
    headers = None
    for email, password in admin_creds:
        r = requests.post(f"{BASE_URL}/auth/login/", json={
            "email": email,
            "password": password
        })
        if r.status_code == 200:
            token = r.json().get('access')
            headers = {"Authorization": f"Bearer {token}"}
            log(f"Admin login successful: {email}", "PASS")
            break
        else:
            log(f"Login attempt failed for {email}: {r.status_code}", "WARN")
    
    if not token:
        log("No admin credentials worked", "FAIL")
        issues.append("Admin login failed - check credentials")
    
    # === SCENARIO 2: Admin Profile ===
    print("\n--- Scenario 2: Admin Profile ---")
    
    if headers:
        r = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
        if r.status_code == 200:
            profile = r.json()
            user_type = profile.get('user_type', 'unknown')
            log(f"Admin profile loaded: {profile.get('email')} (type: {user_type})", "PASS")
            if user_type != 'admin':
                log(f"User type is '{user_type}', not 'admin'", "WARN")
        else:
            log(f"Admin profile failed: {r.status_code}", "FAIL")
            issues.append("Admin profile failed")
    
    # === SCENARIO 3: Django Admin Panel ===
    print("\n--- Scenario 3: Django Admin Panel ---")
    
    r = requests.get(ADMIN_URL, allow_redirects=False)
    if r.status_code in [200, 302]:  # 302 = redirect to login
        log(f"Django admin accessible: HTTP {r.status_code}", "PASS")
    else:
        log(f"Django admin failed: {r.status_code}", "FAIL")
        issues.append("Django admin not accessible")
    
    # === SCENARIO 4: Admin API Access ===
    print("\n--- Scenario 4: Admin API Access ---")
    
    if headers:
        # Admins should be able to list all dealers
        r = requests.get(f"{BASE_URL}/dealers/", headers=headers)
        if r.status_code == 200:
            log("Admin can access dealers list", "PASS")
        else:
            log(f"Dealers list access: {r.status_code}", "WARN")
        
        # Admins should see all vehicles
        r = requests.get(f"{BASE_URL}/vehicles/", headers=headers)
        if r.status_code == 200:
            log("Admin can access vehicles list", "PASS")
        else:
            log(f"Vehicles list access: {r.status_code}", "WARN")
    
    # === SCENARIO 5: Cross-Role Access Test ===
    print("\n--- Scenario 5: Permission Boundaries ---")
    
    # Admin trying dealer-only endpoint (should succeed or fail gracefully)
    if headers:
        r = requests.get(f"{BASE_URL}/vehicles/my_inventory/", headers=headers)
        if r.status_code == 200:
            log("Admin can access inventory (has dealer role too?)", "WARN")
        elif r.status_code in [403, 404]:
            log("Admin correctly denied dealer-specific endpoint", "PASS")
        else:
            log(f"Unexpected response: {r.status_code}", "WARN")
    
    # === SCENARIO 6: Admin Frontend Pages ===
    print("\n--- Scenario 6: Frontend Pages ---")
    
    pages = [
        ("/", "Homepage"),
        ("/login", "Login Page"),
        ("/admin", "Admin Dashboard (if exists)"),
    ]
    for path, name in pages:
        try:
            r = requests.get(f"{FRONTEND_URL}{path}", allow_redirects=False, timeout=5)
            if r.status_code in [200, 307, 308, 404]:
                log(f"{name}: HTTP {r.status_code}", "PASS" if r.status_code != 404 else "WARN")
            else:
                log(f"{name}: HTTP {r.status_code}", "FAIL")
                issues.append(f"{name} returned {r.status_code}")
        except Exception as e:
            log(f"{name} error: {e}", "FAIL")
            issues.append(f"{name} error")
    
    # === SUMMARY ===
    print("\n" + "="*60)
    if issues:
        print(f"  ADMIN WORKFLOW: {len(issues)} ISSUES FOUND")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
    else:
        print("  ADMIN WORKFLOW: ALL TESTS PASSED ✅")
    print("="*60)
    
    return issues

if __name__ == "__main__":
    test_admin_workflow()
