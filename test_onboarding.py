import httpx
import json

def test():
    payload = {
        "step": "Consent",
        "text_input": "yes",
        "language": "English",
        "current_name": "Farmer",
        "current_crop": "Tomato",
        "consent_granted": None
    }
    try:
        res = httpx.post("http://127.0.0.1:8000/chat/onboarding_extract", json=payload, timeout=20.0)
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Consent Granted: {data.get('consent_granted')}")
        print(f"AI Reply: {data.get('ai_reply')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
