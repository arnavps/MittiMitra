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
    total_spoilage_percent = final_rate * duration_hours
    
    return min(total_spoilage_percent, 100.0) # Cap at 100%

def get_heat_multiplier(method: str) -> float:
    multipliers = {
        "Open Field": 1.8,
        "Shaded": 1.0,
        "Open Trolley": 1.5,
        "Covered Pickup": 0.9,
    }
    return multipliers.get(method, 1.0)

def get_preservation_actions(crop_value: float, current_spoilage_pct: float, temp_c: float, storage_type: str) -> Dict[str, Any]:
    """
    Evaluates ROI of preservation actions.
    """
    actions = [
        {"name": "Move to Shade", "cost": 0, "time_mins": 15, "spoilage_reduction_pct": 2.5, "condition": storage_type == "Open Field"},
        {"name": "Wet the Bags", "cost": 50, "time_mins": 10, "spoilage_reduction_pct": 4.0, "condition": temp_c > 35},
        {"name": "Use a Tarp", "cost": 250, "time_mins": 5, "spoilage_reduction_pct": 8.0, "condition": True} # rental
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
                "action": action["name"],
                "cost_inr": action["cost"],
                "loss_saved_inr": round(potential_loss_saved, 2),
                "net_saving_inr": round(net_saving, 2),
                "is_recommended": is_recommended,
                "spoilage_reduction_pct": action["spoilage_reduction_pct"]
            }
            action_details.append(detail)
            
            if is_recommended and net_saving > max_roi:
                max_roi = net_saving
                best_action = detail
                
    return {
        "priority_action": best_action,
        "all_actions": action_details
    }
