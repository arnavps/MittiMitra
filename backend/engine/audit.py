import math
from typing import Dict, Any

def get_base_spoilage_rate(crop_type: str) -> float:
    """Returns the base hourly spoilage rate at 20C for a given crop."""
    rates = {
        "tomato": 0.008, # High perishability
        "potato": 0.002, # Low perishability
        "onion": 0.003,
        "soybean": 0.001,
        "wheat": 0.0005,
        "cotton": 0.0001
    }
    return rates.get(crop_type.lower(), 0.005)

def identify_profit_leaks(current_state: Dict[str, str], crop_type: str, temp_c: float, yield_quintals: float, market_price_per_qtl: float) -> Dict[str, Any]:
    """
    Compares the current audit state against an ideal state to calculate profit leak over 24 hours.
    Returns the rupee difference in spoilage loss.
    """
    
    # Define multipliers for current vs ideal
    # Current state multipliers
    transport_multipliers = {
        "Open Trolley": {"mult": 1.5, "reason": "No solar protection and lack of thermal insulation allows rapid temperature spikes."},
        "Open Pickup": {"mult": 1.5, "reason": "Exposure to direct sunlight heats the vehicle bed, cooking the bottom layers."},
        "Covered Pickup": {"mult": 0.9, "reason": "Tarp protection reflects solar radiation but can still trap some ambient heat."},
        "Reefer": {"mult": 0.3, "reason": "Active cooling maintains optimal physiological temperature, pausing decay."}
    }
    
    storage_multipliers = {
        "Open Field": {"mult": 1.8, "reason": "Direct solar exposure and lack of ventilation causes moisture loss and heat stress."},
        "Shaded": {"mult": 1.0, "reason": "Shade prevents solar heating, but ambient temperature still drives respiration."},
        "Crated": {"mult": 0.8, "reason": "Crates allow 360-degree airflow, removing the 'respiration heat' that building up in bags."},
        "Cold Storage": {"mult": 0.2, "reason": "Near-freezing temperatures effectively put the crop into 'hibernation'."}
    }
    
    current_storage = current_state.get("storage_environment", "Open Field")
    current_transport = current_state.get("vehicle_type", "Open Trolley")
    
    s_info = storage_multipliers.get(current_storage, storage_multipliers["Open Field"])
    t_info = transport_multipliers.get(current_transport, transport_multipliers["Open Trolley"])
    
    current_multiplier = (s_info["mult"] + t_info["mult"]) / 2.0
    current_reasons = [s_info["reason"], t_info["reason"]]
    
    # Ideal state multipliers
    ideal_storage = "Crated" if crop_type.lower() == "tomato" else "Shaded"
    ideal_transport = "Covered Pickup"
    
    i_s_info = storage_multipliers[ideal_storage]
    i_t_info = transport_multipliers[ideal_transport]
    
    ideal_multiplier = (i_s_info["mult"] + i_t_info["mult"]) / 2.0

    # Calculate 24h Spoilage % for both
    base_rate = get_base_spoilage_rate(crop_type)
    q10_factor = 2.5
    target_temp = 20.0
    
    accelerated_rate_24h = base_rate * math.pow(q10_factor, (temp_c - target_temp) / 10.0) * 24.0
    
    current_spoilage_pct = min(accelerated_rate_24h * current_multiplier * 100, 100.0)
    ideal_spoilage_pct = min(accelerated_rate_24h * ideal_multiplier * 100, 100.0)
    
    # Calculate financial difference
    total_crop_value = yield_quintals * market_price_per_qtl
    
    current_loss_inr = (current_spoilage_pct / 100.0) * total_crop_value
    ideal_loss_inr = (ideal_spoilage_pct / 100.0) * total_crop_value
    
    leak_inr_24h = max(0.0, current_loss_inr - ideal_loss_inr)
    leak_per_hour = leak_inr_24h / 24.0
    
    is_high_risk = leak_inr_24h > (total_crop_value * 0.02) # Flag if leak > 2% of total value in 24h
    
    return {
        "current_setup": f"{current_storage} + {current_transport}",
        "ideal_setup": f"{ideal_storage} + {ideal_transport}",
        "leak_inr_24h": round(leak_inr_24h, 2),
        "leak_inr_per_hour": round(leak_per_hour, 2),
        "is_high_risk": is_high_risk,
        "current_spoilage_24h_pct": round(current_spoilage_pct, 2),
        "ideal_spoilage_24h_pct": round(ideal_spoilage_pct, 2),
        "reasons": current_reasons
    }
