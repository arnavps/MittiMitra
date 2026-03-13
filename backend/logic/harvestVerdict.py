"""
Harvest Oracle: Harvest Verdict Logic
Implements the decision matrix for pre-harvest timing recommendations.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta

def calculate_harvest_verdict(
    maturity_percentage: int,
    sync_panic_days: List[Dict[str, Any]],
    weather_forecast: List[Dict[str, Any]],
    crop: str = "Tomato"
) -> Dict[str, Any]:
    """
    Analyzes maturity, regional supply gluts, and weather risks to provide a recommendation.
    """
    
    recommendation = "WAIT"
    reason = "Crop is still maturing. Optimal biomass accumulation in progress."
    confidence = 85
    action_type = "MONITOR"
    
    # Thresholds
    RIPENESS_THRESHOLD = 85 # Minimum percentage for 'Early Exit'
    
    # 1. Check for Weather Risk (Immediate Priority)
    # If heavy rain or extreme heatwave (>40C) in next 48 hours
    for i in range(min(2, len(weather_forecast))):
        day = weather_forecast[i]
        if day.get("rain_mm", 0) > 20 or day.get("max_temp", 0) > 40:
            if maturity_percentage >= 75:
                recommendation = "SELL"
                reason = f"Extreme weather alert ({'Heavy Rain' if day.get('rain_mm', 0) > 20 else 'Heatwave'}) on {day['date']}. Harvest immediately to avoid field-spoilage."
                confidence = 95
                action_type = "EMERGENCY"
                return build_response(recommendation, reason, confidence, action_type)

    # 2. Check for Market Sync-Panic (Supply Glut)
    # If a glut is detected in the next 3-5 days
    for panic_day in sync_panic_days:
        panic_date = datetime.strptime(panic_day["date"], "%Y-%m-%d")
        days_to_panic = (panic_date - datetime.now()).days
        
        if 2 <= days_to_panic <= 5 and panic_day["isSyncPanic"]:
            if maturity_percentage >= RIPENESS_THRESHOLD:
                recommendation = "SELL"
                reason = f"Regional glut detected on {panic_day['date']}. Harvesting 2 days early will secure a higher price (predicted ₹5/kg premium) despite slight weight loss."
                confidence = 80
                action_type = "STRATEGIC"
                return build_response(recommendation, reason, confidence, action_type)

    # 3. Default Maturity Check
    if maturity_percentage >= 95:
        recommendation = "SELL"
        reason = "Crop has reached peak maturity. Maximum weight and quality achieved."
        confidence = 100
        action_type = "OPTIMAL"
    elif maturity_percentage >= 85:
        recommendation = "HOLD"
        reason = "Approaching peak maturity. Monitor market for arbitrage signal."
        confidence = 90
        action_type = "READY"

    return build_response(recommendation, reason, confidence, action_type)

def build_response(rec: str, reason: str, conf: int, action: str) -> Dict[str, Any]:
    return {
        "verdict": rec,
        "explanation": reason,
        "confidence_score": conf,
        "action_priority": action,
        "generated_at": datetime.now().isoformat()
    }
