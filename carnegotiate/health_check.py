"""
Health check script to verify API endpoints
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

def check_endpoint(name, url, expected_status=200):
    try:
        resp = requests.get(url, timeout=5)
        status = "✓" if resp.status_code == expected_status else "✗"
        print(f"{status} {name}: {resp.status_code}")
        return resp.status_code == expected_status
    except Exception as e:
        print(f"✗ {name}: {e}")
        return False

print("=" * 50)
print("API Health Check")
print("=" * 50)

# Public endpoints
check_endpoint("Vehicles List", f"{BASE_URL}/vehicles/")
check_endpoint("Featured Vehicles", f"{BASE_URL}/vehicles/featured/")
check_endpoint("Makes List", f"{BASE_URL}/vehicles/makes/")

# Auth endpoints (should return 401 or 405 for GET)
check_endpoint("Auth Login (exists)", f"{BASE_URL}/auth/login/", expected_status=405)

# Dealers
check_endpoint("Dealers List", f"{BASE_URL}/dealers/")

print("=" * 50)
print("Done!")
