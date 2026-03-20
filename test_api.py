import httpx
import json

def test():
    api_key = "579b464db66ec23bdd0000018f6d2aeef8304ec27142be2cf3ef3688"
    url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit=5&filters[commodity]=TOMATO"
    try:
        res = httpx.get(url, timeout=20.0)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            records = data.get("records", [])
            print(f"Count: {len(records)}")
            if records:
                print(f"Sample: {records[0].get('market')} - {records[0].get('modal_price')}")
        else:
            print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
