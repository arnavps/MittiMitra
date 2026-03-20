import datetime
import math
from typing import Dict, Any, List

def calculate_dynamic_spoilage(base_q10: float, current_temp: float, target_temp: float, duration_hours: float, multiplier: float, disease_multiplier: float = 1.0) -> float:
    """
    Calculates dynamic spoilage based on the Q10 temperature coefficient formula.
    Rate = Base_Rate * Q10 ^ ((Current_Temp - Target_Temp) / 10) * D_m
    """
    # Standard Q10 for fresh produce is often ~2.5 to 3.0. We use 2.5 here.
    q10_factor = 2.5
    
    # Calculate accelerated rate (including Pathological Multiplier Dm)
    accelerated_rate = base_q10 * math.pow(q10_factor, (current_temp - target_temp) / 10.0) * disease_multiplier
    
    # Apply context multipliers (e.g. Open Field vs Shaded)
    final_rate = accelerated_rate * multiplier
    
    # Total spoilage over duration
    total_spoilage_percent = final_rate * duration_hours * 100.0
    
    return min(total_spoilage_percent, 100.0) # Cap at 100%

def get_heat_multiplier(method: str) -> float:
    multipliers = {
        "Open Field": 1.8,
        "Shaded": 1.0,
        "Open Trolley": 1.5,
        "Covered Pickup": 0.9,
    }
    return multipliers.get(method, 1.0)

def get_preservation_actions(crop_value: float, current_spoilage_pct: float, temp_c: float, storage_type: str, crop_type: str = "Cotton") -> Dict[str, Any]:
    """
    Evaluates ROI of preservation actions with descriptive details.
    """
    actions = [
        {
            "id": "move_to_shade",
            "name": "Move to Shade",
            "cost": 0,
            "time_mins": 15,
            "spoilage_reduction_pct": 2.5,
            "condition": storage_type == "Open Field",
            "description": f"Moving {crop_type} from direct sunlight to a shaded area reduces internal heat buildup.",
            "ai_advice": f"Namaste! Since your {crop_type} is currently in the open field at {temp_c}°C, moving it to shade is a zero-cost way to save ₹{{saving}} today. The sun is your biggest enemy right now."
        },
        {
            "id": "wet_the_bags",
            "name": "Wet the Bags",
            "cost": 50,
            "time_mins": 10,
            "spoilage_reduction_pct": 4.0,
            "condition": temp_c > 32,
            "description": "Evaporative cooling through wet jute bags can lower the crop temperature by 3-5 degrees.",
            "ai_advice": f"I recommend wetting the gunny bags. As the water evaporates, it pulls heat away from the {crop_type}, acting like a natural refrigerator. This is very effective for {crop_type} in this heat."
        },
        {
            "id": "use_a_tarp",
            "name": "Use a Tarp",
            "cost": 250,
            "time_mins": 5,
            "spoilage_reduction_pct": 8.0,
            "condition": True,
            "description": "A high-quality breathable tarpaulin protects from humidity and sudden temperature spikes.",
            "ai_advice": f"Using a silver-coated tarp will reflect 90% of solar radiation. For {crop_type}, this prevents the 'sweating' effect that leads to rapid fungal growth. It's an investment that pays for itself in hours."
        }
    ]
    
    best_action = None
    max_roi = -1
    
    action_details = []
    
    for action in actions:
        if action["condition"]:
            potential_loss_saved = (action["spoilage_reduction_pct"] / 100.0) * crop_value
            net_saving = potential_loss_saved - action["cost"]
            
            is_recommended = net_saving > 0
            
            detail = {
                "action_id": action["id"],
                "action": action["name"],
                "cost_inr": action["cost"],
                "loss_saved_inr": round(potential_loss_saved, 2),
                "net_saving_inr": round(net_saving, 2),
                "is_recommended": is_recommended,
                "spoilage_reduction_pct": action["spoilage_reduction_pct"],
                "description": action["description"],
                "ai_advice": action["ai_advice"].replace("{saving}", str(round(net_saving, 2)))
            }
            action_details.append(detail)
            
            if is_recommended and net_saving > max_roi:
                max_roi = net_saving
                best_action = detail
                
    return {
        "priority_action": best_action,
        "all_actions": action_details
    }
