import httpx
import json

def test():
    payload = {
        "crop": "Tomato",
        "location": {"lat": 19.15, "lng": 72.9389},
        "yield_est_quintals": 50.0
    }
    try:
        res = httpx.post("http://127.0.0.1:8000/recommendation", json=payload, timeout=5.0)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
