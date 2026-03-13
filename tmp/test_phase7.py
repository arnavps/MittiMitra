import requests
import json

BASE_URL = "http://127.0.0.1:8001/oracle"

def test_harvest_oracle():
    print("\nTesting Harvest Oracle Tactical Verdict...")
    
    # Payload simulating an upcoming supply glut (Sync-Panic)
    payload = {
        "planting_date": "2026-01-01",
        "crop": "Tomato",
        "sync_panic_days": [
            {"date": "2026-03-17", "isSyncPanic": True}
        ],
        "weather_forecast": [
            {"date": "2026-03-15", "max_temp": 32, "rain_mm": 5}
        ]
    }
    
    try:
        r = requests.post(f"{BASE_URL}/forecast", json=payload)
        print(f"Status: {r.status_code}")
        data = r.json()
        print(json.dumps(data, indent=2))
        
        # Check for the strategic early exit recommendation
        verdict = data.get("oracle_verdict", {})
        print(f"\nVerdict: {verdict.get('verdict')}")
        print(f"Action Priority: {verdict.get('action_priority')}")
        print(f"Explanation: {verdict.get('explanation')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_harvest_oracle()
