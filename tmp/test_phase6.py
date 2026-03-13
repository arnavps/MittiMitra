import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_ecosystem():
    print("Testing Logistics Cluster...")
    payload = {
        "lat": 19.9975,
        "lon": 73.7898,
        "target_mandi": "Vashi",
        "harvest_date": "2026-03-15",
        "user_yield_qtl": 50.0,
        "market_price": 2500.0
    }
    r = requests.post(f"{BASE_URL}/ecosystem/cluster", json=payload)
    print(f"Cluster Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

def test_oracle():
    print("\nTesting Harvest Oracle...")
    payload = {
        "planting_date": "2025-12-01",
        "crop": "Tomato"
    }
    r = requests.post(f"{BASE_URL}/oracle/forecast", json=payload)
    print(f"Oracle Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

def test_storage():
    print("\nTesting Cold Storage ROI...")
    payload = {
        "yield_qtl": 50.0,
        "market_price": 1200.0,
        "current_spoilage_risk": 35.0
    }
    r = requests.post(f"{BASE_URL}/ecosystem/storage-roi", json=payload)
    print(f"Storage ROI Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

def test_fpo_stats():
    print("\nTesting FPO Stats...")
    r = requests.get(f"{BASE_URL}/ecosystem/fpo/stats")
    print(f"FPO Stats Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    try:
        test_ecosystem()
        test_oracle()
        test_storage()
        test_fpo_stats()
    except Exception as e:
        print(f"Error connecting to server: {e}")
