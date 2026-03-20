import httpx
import json

def test():
    payload = {
        "crop": "Cotton",
        "location": {"lat": 19.1767, "lng": 72.9475},
        "yield_est_quintals": 50.0
    }
    try:
        res = httpx.post("http://127.0.0.1:8000/recommendation", json=payload, timeout=20.0)
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Area: {data.get('source_area')}")
        print(f"Mandi Count: {len(data.get('regional_options', []))}")
        # Print first few mandi names
        for i, m in enumerate(data.get('regional_options', [])[:6]):
            print(f"  {i+1}. {m.get('mandi_name') or m.get('name')} ({m.get('distance_km')} km)")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
