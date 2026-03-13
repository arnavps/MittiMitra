import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8001"

def test_unified_recommendation():
    print("\n--- Testing Unified Recommendation Logic ---")
    
    # CASE 1: Low Maturity (Planting 30 days ago for Tomato)
    # Market might be GOOD, but Maturity should force RED (WAIT)
    planting_date_young = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    payload_young = {
        "location": {"lat": 18.5204, "lng": 73.8567},
        "crop": "Tomato",
        "yield_est_quintals": 50.0,
        "language": "en",
        "planting_date": planting_date_young
    }
    
    print(f"\n1. Testing YOUNG CROP (Planted: {planting_date_young})")
    res = requests.post(f"{BASE_URL}/recommendation", json=payload_young)
    if res.ok:
        data = res.json()
        print(f"   Status: {data['status']}")
        print(f"   Message: {data.get('shock_alert', {}).get('message', 'N/A')}")
        print(f"   Maturity: {data.get('oracle', {}).get('maturity', {}).get('current_maturity_pct')}%")
        
        if data['status'] == 'RED' and 'growth phase' in data['shock_alert']['message']:
            print("   ✅ SUCCESS: Maturity Lock applied correctly.")
        else:
            print("   ❌ FAILURE: Maturity Lock not applied.")
    else:
        print(f"   Error: {res.text}")

    # CASE 2: High Maturity (Planting 75 days ago for Tomato)
    # Should show GREEN (SELL) if prices are good
    planting_date_mature = (datetime.now() - timedelta(days=75)).strftime("%Y-%m-%d")
    
    payload_mature = {
        "location": {"lat": 18.5204, "lng": 73.8567},
        "crop": "Tomato",
        "yield_est_quintals": 50.0,
        "language": "en",
        "planting_date": planting_date_mature
    }
    
    print(f"\n2. Testing MATURE CROP (Planted: {planting_date_mature})")
    res = requests.post(f"{BASE_URL}/recommendation", json=payload_mature)
    if res.ok:
        data = res.json()
        print(f"   Status: {data['status']}")
        print(f"   Maturity: {data.get('oracle', {}).get('maturity', {}).get('current_maturity_pct')}%")
        
        if data['status'] == 'GREEN':
            print("   ✅ SUCCESS: Mature crop shows SELL (Market Optimal).")
        else:
            print("   ❌ FAILURE: Mature crop still showing WAIT (Unexpected).")

if __name__ == "__main__":
    test_unified_recommendation()
