import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_dealers():
    print("=== TEST: List Dealers (Public) ===")
    r = requests.get(f"{BASE_URL}/dealers/")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.text}")

    print("\n=== TEST: Dealer Login & Profile ===")
    payload = {
        "email": "dealer@test.com",
        "password": "pass1234"
    }
    dealer_token = None
    try:
        r = requests.post(f"{BASE_URL}/auth/login/", json=payload)
        if r.status_code == 200:
            dealer_token = r.json().get("access")
            print("✅ PASS - Login")
        else:
            print(f"❌ FAIL - Login {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: {e}")
    
    if dealer_token:
        headers = {"Authorization": f"Bearer {dealer_token}"}
        
        print("\n=== TEST: Get Dealer Profile ===")
        # Endpoint is /dealers/me/ based on ViewSet 'me' action
        r = requests.get(f"{BASE_URL}/dealers/me/", headers=headers)
        if r.status_code == 200:
            print("✅ PASS")
        else:
            print(f"❌ FAIL - Use 'dealers/profile' or 'auth/me'? Prompt says 'dealers/profile' but auth/me also returns profile info.")
            # Check prompt: GET http://localhost:8000/api/v1/dealers/profile/
            # If it fails, maybe that endpoint doesn't exist?
            print(f"Status: {r.status_code}")

        print("\n=== TEST: Get Dealer Stats ===")
        r = requests.get(f"{BASE_URL}/dealers/stats/", headers=headers)
        if r.status_code == 200:
            print("✅ PASS")
        else:
            print(f"❌ FAIL - {r.status_code}")

        print("\n=== TEST: Get My Inventory (Dealer) ===")
        r = requests.get(f"{BASE_URL}/vehicles/my_inventory/", headers=headers)
        if r.status_code == 200:
            print("✅ PASS")
        else:
            print(f"❌ FAIL - {r.status_code}")

if __name__ == "__main__":
    test_dealers()
