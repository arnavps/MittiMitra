import requests
import json

def test_audit():
    url = "http://127.0.0.1:8000/recommendation"
    
    # Test case 1: Default-like values
    payload1 = {
        "crop": "Tomato",
        "location": {"lat": 18.5204, "lng": 73.8567},
        "yield_est_quintals": 50.0,
        "storage_type": "Open Field",
        "transport_type": "Open Trolley",
        "is_harvested": True
    }
    
    # Test case 2: Optimized values
    payload2 = {
        "crop": "Tomato",
        "location": {"lat": 18.5204, "lng": 73.8567},
        "yield_est_quintals": 50.0,
        "storage_type": "Crated",
        "transport_type": "Covered Pickup",
        "is_harvested": True
    }
    
    print("Testing with Open Field + Open Trolley...")
    res1 = requests.post(url, json=payload1)
    if res1.status_code == 200:
        audit1 = res1.json().get("logistics_audit")
        print(f"Audit Result 1: {audit1['current_setup']}")
        print(f"Loss 24h: {audit1['leak_inr_24h']}")
    else:
        print(f"Error 1: {res1.status_code} - {res1.text}")

    print("\nTesting with Crated + Covered Pickup...")
    res2 = requests.post(url, json=payload2)
    if res2.status_code == 200:
        audit2 = res2.json().get("logistics_audit")
        print(f"Audit Result 2: {audit2['current_setup']}")
        print(f"Loss 24h: {audit2['leak_inr_24h']}")
    else:
        print(f"Error 2: {res2.status_code} - {res2.text}")

if __name__ == "__main__":
    test_audit()
