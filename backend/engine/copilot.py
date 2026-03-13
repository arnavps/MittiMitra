from typing import List, Dict, Any, Optional
import math
from engine.decay_logic import calculate_quality_loss
from engine.profit_calc import get_net_realization

def check_thermal_safety(
    crop: str, 
    current_temp: float, 
    path_forecasts: List[Dict[str, float]], 
    remaining_hours: float
) -> Dict[str, Any]:
    """
    Monitors path for temperature increases that exceed the 'Safe Spoilage Threshold' (>20% risk).
    path_forecasts: list of {temp: float, hours_from_now: float}
    """
    max_path_temp = current_temp
    for forecast in path_forecasts:
        max_path_temp = max(max_path_temp, forecast["temp"])
    
    # Calculate risk at peak temperature
    # humidity assumption: 50% for transit
    risk_pct = calculate_quality_loss(crop, max_path_temp, 50.0, remaining_hours)
    
    critical_threshold = 20.0
    needs_reroute = risk_pct > critical_threshold
    
    return {
        "needs_reroute": needs_reroute,
        "current_risk": round(risk_pct, 2),
        "peak_temp": max_path_temp,
        "message": "Thermal safety threshold exceeded! High spoilage risk detected on remaining route." if needs_reroute else "Route is thermally safe."
    }

def detect_market_price_drop(
    current_price: float, 
    historical_prices: List[float], 
    z_threshold: float = 1.5
) -> Dict[str, Any]:
    """
    Detects if the current price is a significant drop (Z-Score > threshold).
    """
    if not historical_prices or len(historical_prices) < 5:
        return {"alert": False, "z_score": 0}
        
    mean = sum(historical_prices) / len(historical_prices)
    variance = sum((x - mean) ** 2 for x in historical_prices) / len(historical_prices)
    std_dev = math.sqrt(variance)
    
    if std_dev == 0:
        return {"alert": False, "z_score": 0}
        
    z_score = (mean - current_price) / std_dev
    alert = z_score > z_threshold
    
    return {
        "alert": alert,
        "z_score": round(z_score, 2),
        "drop_amount": round(mean - current_price, 2)
    }

def find_emergency_reroute(
    current_lat: float,
    current_lng: float,
    crop: str,
    yield_qtl: float,
    available_mandis: List[Dict[str, Any]],
    current_target_mandi_id: str
) -> Optional[Dict[str, Any]]:
    """
    Finds a better destination if the current one is failing (price drop or heat).
    """
    # Logic: Search for mandis within a reasonable "panic radius" (100km)
    # that offer better Net Realization than the current failing target.
    
    best_option = None
    max_net_realization = -float('inf')
    
    for mandi in available_mandis:
        if mandi["id"] == current_target_mandi_id:
            continue
            
        # Simplified distance from current location
        # In a real app, use Haversine or Google Maps Matrix
        dist = math.sqrt((mandi["lat"] - current_lat)**2 + (mandi["lng"] - current_lng)**2) * 111 # rough km
        
        if dist > 150: # Don't reroute too far away in an emergency
            continue
            
        realization = get_net_realization(
            market_price=mandi["current_price"],
            crop_type=crop,
            distance_km=dist,
            temp_c=30.0, # fallback
            humidity=50.0,
            hours_to_market=dist/30.0,
            yield_est=yield_qtl
        )
        
        if realization > max_net_realization:
            max_net_realization = realization
            best_option = {
                "mandi_name": mandi["name"],
                "distance_km": round(dist, 1),
                "new_price": mandi["current_price"],
                "profit_diff": 0 # to be calculated against current failing price
            }
            
    return best_option
