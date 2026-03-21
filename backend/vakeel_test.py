import requests
import json

url = "http://127.0.0.1:8000/chat/explain"
headers = {"Content-Type": "application/json"}
payload = {
    "farmer_query": "Why is the profit low?",
    "dashboard_context": {
        "status": "GREEN",
        "best_mandi": "Mandi A",
        "total_net_profit": 10000,
        "net_realization_inr_per_quintal": 2000,
        "yield_quintals": 5,
        "weather": {"temperature_c": 35, "humidity_percent": 60, "rain_probability_percent": 10},
        "mandi_stats": {"current_price": 2500},
        "shock_alert": {"is_shock": False},
        "routing_data": {"routes": [], "optimal_id": None},
        "logistics_recommendations": [],
        "shared_logistics": {},
        "logistics_audit": {
            "is_high_risk": True,
            "current_setup": "Open Field",
            "leak_inr_per_hour": 100,
            "ideal_setup": "Crated",
            "reasons": ["Solar heat"]
        }
    },
    "language": "English"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
