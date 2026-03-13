from datetime import datetime, timedelta
from typing import Dict, Any, List
import random

# Mock crop maturity data (days from planting to harvest)
CROP_MATURITY_DATA = {
    "potato": {"min_days": 90, "max_days": 120, "ideal_days": 105},
    "onion": {"min_days": 100, "max_days": 150, "ideal_days": 130},
    "tomato": {"min_days": 60, "max_days": 90, "ideal_days": 75},
    "soybean": {"min_days": 80, "max_days": 110, "ideal_days": 100},
    "cotton": {"min_days": 150, "max_days": 180, "ideal_days": 165},
    "wheat": {"min_days": 110, "max_days": 130, "ideal_days": 120},
    "rice": {"min_days": 100, "max_days": 120, "ideal_days": 110}
}

def calculate_harvest_window(planting_date_str: str, crop: str) -> Dict[str, Any]:
    """
    Estimates current maturity and predicts the ideal 72-hour harvest window.
    """
    crop_lower = crop.lower()
    maturity_data = CROP_MATURITY_DATA.get(crop_lower, CROP_MATURITY_DATA["tomato"]) # Default to tomato
    
    planting_date = datetime.strptime(planting_date_str, "%Y-%m-%d")
    days_since_planting = (datetime.now() - planting_date).days
    
    # Calculate maturity percentage
    maturity_pct = min(100, (days_since_planting / maturity_data["ideal_days"]) * 100)
    
    # Predict optimal window (simplified logic: peaks around ideal_days)
    days_to_peak = maturity_data["ideal_days"] - days_since_planting
    
    # Ideal 72-hour window is typically 1 day before/after peak biological weight
    peak_date = datetime.now() + timedelta(days=days_to_peak)
    window_start = peak_date - timedelta(hours=36)
    window_end = peak_date + timedelta(hours=36)
    
    # Simulate "Price-to-Weight" ratio optimization
    # In reality, this would use price forecasts
    current_price_trend = random.choice(["RISING", "FALLING", "STABLE"])
    weight_gain_per_day = 0.5 if maturity_pct < 95 else -0.2 # Weight drops if over-mature
    
    is_optimal_now = 95 <= maturity_pct <= 100
    
    return {
        "current_maturity_pct": round(maturity_pct, 1),
        "days_since_planting": days_since_planting,
        "ideal_days": maturity_data["ideal_days"],
        "window_start": window_start.strftime("%Y-%m-%d %H:%M"),
        "window_end": window_end.strftime("%Y-%m-%d %H:%M"),
        "days_to_peak": days_to_peak,
        "status": "IDEAL" if is_optimal_now else "WAIT" if maturity_pct < 95 else "OVERDUE",
        "advice": f"Harvest in {days_to_peak} days for maximum weight-to-price ratio." if days_to_peak > 0 else "Harvest IMMIEDIATELY to avoid weight loss and spoilage."
    }
