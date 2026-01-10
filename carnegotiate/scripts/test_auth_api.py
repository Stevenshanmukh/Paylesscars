import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_auth():
    print("=== TEST: User Registration ===")
    email = f"newuser_{int(time.time())}@test.com"
    payload = {
        "email": email,
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "role": "buyer"
    }
    try:
        r = requests.post(f"{BASE_URL}/auth/register/", json=payload)
        print(f"Status: {r.status_code}")
        if r.status_code == 201:
            print("✅ PASS")
            print(r.json())
        else:
            print("❌ FAIL")
            print(r.text)
    except Exception as e:
        print(f"❌ FAIL: {e}")

    print("\n=== TEST: User Login (Buyer) ===")
    # Using credentials from prompt
    payload = {
        "email": "buyer@test.com",
        "password": "pass1234"
    }
    buyer_token = None
    try:
        r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
        if r.status_code == 200:
            print("✅ PASS - Token received")
            buyer_token = r.json().get("access")
        else:
            print(f"❌ FAIL - Status {r.status_code}")
            print(r.text)
    except Exception as e:
        print(f"❌ FAIL: {e}")

    if buyer_token:
        print("\n=== TEST: Get User Profile ===")
        headers = {"Authorization": f"Bearer {buyer_token}"}
        r = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
        if r.status_code == 200:
            print("✅ PASS")
            print(r.json())
        else:
            print(f"❌ FAIL - Status {r.status_code}")
            print(r.text)

    print("\n=== TEST: Dealer Login ===")
    payload = {
        "email": "dealer@test.com",
        "password": "pass1234"
    }
    try:
        r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
        if r.status_code == 200:
            print("✅ PASS - Dealer token received")
        else:
            print(f"❌ FAIL - Status {r.status_code}")
            print(r.text)
    except Exception as e:
        print(f"❌ FAIL: {e}")

if __name__ == "__main__":
    test_auth()
