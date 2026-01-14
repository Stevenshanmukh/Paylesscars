"""
API Endpoint Verification Script
Run: python manage.py shell < scripts/verify_endpoints.py
"""

import requests
import sys

# Try port 8000 first, checking if it's reachable
BASE_URL = "http://localhost:8000/api/v1"

# Test endpoints (no auth required)
PUBLIC_ENDPOINTS = [
    ("GET", "/vehicles/", 200),
    ("GET", "/vehicles/featured/", 200),
    ("GET", "/vehicles/makes/", 200),
    ("GET", "/dealers/", 200),
]

# Test endpoints (auth required - will return 401 without token)
AUTH_ENDPOINTS = [
    ("GET", "/auth/me/", 401),
    ("GET", "/negotiations/", 401),
    ("GET", "/dealers/profile/", 401),
    ("GET", "/users/saved-vehicles/", 401),
]

def test_endpoint(method, path, expected_status):
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json={}, timeout=5)
        
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {method} {path} -> {response.status_code} (expected {expected_status})")
        return response.status_code == expected_status
    except Exception as e:
        print(f"❌ {method} {path} -> ERROR: {e}")
        return False

print("=" * 60)
print(f"Testing API at {BASE_URL}")
print("PUBLIC ENDPOINTS")
print("=" * 60)
for method, path, expected in PUBLIC_ENDPOINTS:
    test_endpoint(method, path, expected)

print("\n" + "=" * 60)
print("AUTH-REQUIRED ENDPOINTS (expecting 401)")
print("=" * 60)
for method, path, expected in AUTH_ENDPOINTS:
    test_endpoint(method, path, expected)
