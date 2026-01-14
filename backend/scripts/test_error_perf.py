import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_perf(url, name):
    start = time.time()
    try:
        r = requests.get(url)
        duration = (time.time() - start) * 1000
        status = "✅" if duration < 500 else "⚠️" if duration < 1000 else "❌"
        print(f"{status} {name}: {duration:.0f}ms (HTTP {r.status_code})")
        return duration
    except Exception as e:
        print(f"❌ {name}: Failed {e}")
        return 0

def test_error_handling():
    print("\n=== ERROR HANDLING TESTS ===")
    
    # 401
    print("Test 1: Missing Token (401)")
    r = requests.get(f"{BASE_URL}/negotiations/")
    if r.status_code == 401:
        print("✅ PASS (401)")
    else:
        print(f"❌ FAIL ({r.status_code})")
        
    # 404
    print("Test 2: Invalid ID (404)")
    r = requests.get(f"{BASE_URL}/vehicles/00000000-0000-0000-0000-000000000000/")
    if r.status_code == 404:
        print("✅ PASS (404)")
    else:
        print(f"❌ FAIL ({r.status_code})")
        
    # 400 Bad Login
    print("Test 3: Bad Credentials (401/400)")
    r = requests.post(f"{BASE_URL}/auth/login/", json={"email": "bad", "password": "bad"})
    if r.status_code in [400, 401]:
        print(f"✅ PASS ({r.status_code})")
    else:
        print(f"❌ FAIL ({r.status_code})")

def run_tests():
    print("=== PERFORMANCE CHECKS ===")
    test_perf(f"{BASE_URL}/vehicles/", "List Vehicles")
    test_perf(f"{BASE_URL}/dealers/", "List Dealers")
    test_perf(f"http://localhost:3000/", "Frontend Home")
    
    test_error_handling()

if __name__ == "__main__":
    run_tests()
