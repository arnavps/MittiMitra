from api.chat import build_system_prompt

mock_context = {
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
}

try:
    p = build_system_prompt(mock_context, "English")
    print("SUCCESS")
    print(p)
except Exception as e:
    import traceback
    traceback.print_exc()
