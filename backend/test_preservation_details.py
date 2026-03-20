import requests
import json

def test_preservation():
    url = "http://127.0.0.1:8000/recommendation"
    
    payload = {
        "crop": "Tomato",
        "location": {"lat": 18.5204, "lng": 73.8567},
        "yield_est_quintals": 50.0,
        "storage_type": "Open Field",
        "transport_type": "Open Trolley",
        "is_harvested": True
    }
    
    print("Testing for Tomato preservation advice...")
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        data = res.json()
        pres = data.get("preservation", {})
        priority = pres.get("priority_action", {})
        all_actions = pres.get("all_actions", [])
        
        print(f"Priority Action: {priority.get('action')}")
        print(f"Description: {priority.get('description')}")
        print(f"AI Advice: {priority.get('ai_advice')}")
        
        print("\nAll Recommended Actions:")
        for a in all_actions:
            if a.get('is_recommended'):
                print(f"- {a.get('action')}: Saving ₹{a.get('net_saving_inr')}")
    else:
        print(f"Error: {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_preservation()
