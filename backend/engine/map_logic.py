from typing import List, Dict, Any
from engine.profit_calc import get_net_realization

def calculate_spatial_profit(
    crop: str, 
    yield_est: float, 
    temp_c: float, 
    humidity: float, 
    available_mandis: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Evaluates multiple destination mandis and calculates Net Realization for each.
    Returns the list sorted by most profitable first.
    """
    results = []
    
    for mandi in available_mandis:
        price = mandi["current_price"]
        dist = mandi["distance_km"]
        
        # Completely exclude mandis that are unrealistically far away for a smallholder farmer (>500km)
        # unless it is the ONLY mandi available
        if dist > 500 and len(available_mandis) > 1:
            continue
            
        # Estimate transit time (assume 30 km/hr average speed for agricultural transport)
        estimated_transit_hours = dist / 30.0
        
        # We need to calculate profit per quintal first
        net_profit_per_quintal = get_net_realization(
            market_price=price,
            crop_type=crop,
            distance_km=dist,
            temp_c=temp_c,
            humidity=humidity,
            hours_to_market=estimated_transit_hours,
            yield_est=yield_est,
            transport_cost_per_km=mandi.get("transport_rate_per_km", 15.0)
        )
        
        # Total profit based on yield
        total_net_profit = net_profit_per_quintal * yield_est
        
        # Calculate raw quality loss percentage for visualization
        from engine.decay_logic import calculate_quality_loss
        loss_pct = calculate_quality_loss(crop, temp_c, humidity, estimated_transit_hours)
        
        # Flag "Dead Zones" where spoilage risk is critically high (>15%) due to distance/heat
        is_dead_zone = loss_pct > 15.0
        
        results.append({
            "mandi_name": mandi["name"],
            "distance_km": dist,
            "estimated_transit_hours": round(estimated_transit_hours, 1),
            "market_price": price,
            "lat": mandi.get("lat"),
            "lng": mandi.get("lng"),
            "net_profit_per_quintal": round(net_profit_per_quintal, 2),
            "total_net_profit": round(total_net_profit, 2),
            "quality_loss_pct": round(loss_pct, 2),
            "is_dead_zone": is_dead_zone,
            "is_recommended": False # Will be set later
        })
        
    # Sort by total net profit, descending
    results.sort(key=lambda x: x["total_net_profit"], reverse=True)
    
    # Mark the top result as recommended
    if results:
        results[0]["is_recommended"] = True
        
    return results
