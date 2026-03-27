
import requests
import json

BASE_URL = "http://127.0.0.1:8000/chat/onboarding_extract"
headers = {"Content-Type": "application/json"}

def test_onboarding_flow():
    print("--- Phase 1: Initial Greeting & Crop Extraction ---")
    payload = {
        "step": "Consent",
        "text_input": "Namaste, I have Cotton crop.",
        "language": "English",
        "consent_granted": None,
        "current_crop": ""
    }
    
    response = requests.post(BASE_URL, headers=headers, data=json.dumps(payload))
    data = response.json()
    print(f"AI: {data['ai_reply']}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    # Verify Implicit Consent
    assert data['consent_granted'] is True
    assert data['crop'] == "Cotton"
    
    print("\n--- Phase 2: Yield Extraction ---")
    payload.update({
        "consent_granted": data['consent_granted'],
        "current_crop": data['crop'],
        "text_input": "I have 50 quintals"
    })
    response = requests.post(BASE_URL, headers=headers, data=json.dumps(payload))
    data = response.json()
    print(f"AI: {data['ai_reply']}")
    assert data['yield_quintals'] == 50

    print("\n--- Phase 3: Harvest Status Branching (Already Harvested) ---")
    payload.update({
        "current_yield": data['yield_quintals'],
        "location_provided": True, # Mocking location already provided
        "text_input": "Yes it is already harvested"
    })
    response = requests.post(BASE_URL, headers=headers, data=json.dumps(payload))
    data = response.json()
    print(f"AI: {data['ai_reply']}")
    assert data['harvest_status'] == "already_harvested"
    # Should ask about storage next
    assert "storage" in data['ai_reply'].lower()

    print("\n--- Phase 4: Health Issue & Camera Trigger ---")
    payload.update({
        "harvest_status": data['harvest_status'],
        "current_storage": "Shed",
        "text_input": "Everything is in the shed but I see some black spots on the leaves."
    })
    response = requests.post(BASE_URL, headers=headers, data=json.dumps(payload))
    data = response.json()
    print(f"AI: {data['ai_reply']}")
    assert data['health_issue'] is True
    assert data['visual_audit_required'] is True
    assert "camera" in data['ai_reply'].lower()

    print("\nTest passed successfully!")

if __name__ == "__main__":
    try:
        test_onboarding_flow()
    except Exception as e:
        print(f"Test failed or Server not running: {e}")
