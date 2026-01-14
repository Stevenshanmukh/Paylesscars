import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_vehicles():
    print("=== TEST: List Vehicles (Public) ===")
    r = requests.get(f"{BASE_URL}/vehicles/")
    print(f"Status: {r.status_code}")
    vehicle_id = None
    if r.status_code == 200:
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        count = len(results)
        print(f"Vehicles returned: {count}")
        if count > 0:
            print("✅ PASS")
            vehicle_id = results[0]['id']
        else:
            print("❌ FAIL - No vehicles returned")
    else:
        print(f"❌ FAIL - {r.text}")

    if vehicle_id:
        print("\n=== TEST: Get Single Vehicle ===")
        r = requests.get(f"{BASE_URL}/vehicles/{vehicle_id}/")
        if r.status_code == 200:
            print("✅ PASS")
        else:
            print(f"❌ FAIL - {r.status_code}")

        print("\n=== TEST: Get Similar Vehicles ===")
        r = requests.get(f"{BASE_URL}/vehicles/{vehicle_id}/similar/")
        if r.status_code == 200:
            print("✅ PASS")
        else:
            print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: Get Featured Vehicles ===")
    r = requests.get(f"{BASE_URL}/vehicles/featured/")
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: Get Vehicle Makes ===")
    r = requests.get(f"{BASE_URL}/vehicles/makes/")
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    print("\n=== TEST: Vehicle Search with Filters ===")
    r = requests.get(f"{BASE_URL}/vehicles/?make=Honda&min_price=10000&max_price=50000")
    if r.status_code == 200:
        print("✅ PASS")
    else:
        print(f"❌ FAIL - {r.status_code}")

    # Dealer Create Vehicle Test requires Dealer Token
    # I'll skip it here or fetch token again.
    # For now, public read tests are enough for this script.

if __name__ == "__main__":
    test_vehicles()
