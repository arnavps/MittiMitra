import requests

url = "http://127.0.0.1:8000/routing/"
payload = {
    "crop": "Tomato",
    "start_loc": {"lat": 18.5204, "lng": 73.8567},
    "end_loc": {"lat": 18.6204, "lng": 73.9567},
    "yield_qtl": 50,
    "storage_type": "Open Field",
    "transport_type": "Open Trolley",
    "market_price": 2000
}

try:
    print(f"Testing {url}...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Also test without trailing slash
    url_no_slash = "http://127.0.0.1:8000/routing"
    print(f"\nTesting {url_no_slash}...")
    response_no_slash = requests.post(url_no_slash, json=payload)
    print(f"Status Code: {response_no_slash.status_code}")
    # Note: requests follows redirects, so we might see 200 after redirect
    print(f"Success: {response_no_slash.status_code == 200}")

except Exception as e:
    print(f"Error: {e}")
