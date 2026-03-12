import math
import random
from typing import List, Dict, Any
from engine.spoilage_pro import calculate_dynamic_spoilage, get_heat_multiplier

def calculate_haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two GPS points."""
    R = 6371.0 # Radius of the Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_path_spoilage(
    crop: str,
    segments: List[Dict[str, Any]],
    storage_type: str,
    transport_type: str,
    base_hourly_q10: float = 0.005
) -> float:
    """
    Applies Q10 formula across segments of a path.
    Each segment contains: {'temp': float, 'duration_hours': float, 'vibration_index': float}
    """
    total_loss_pct = 0.0
    storage_mult = get_heat_multiplier(storage_type)
    transport_mult = get_heat_multiplier(transport_type)
    combined_mult = (storage_mult + transport_mult) / 2.0
    
    for segment in segments:
        temp = segment.get('temp', 30.0)
        duration = segment.get('duration_hours', 1.0)
        # Road quality / vibration penalty (vibration_index: 1.0 = smooth, 2.0 = very bumpy)
        vibration_mult = segment.get('vibration_index', 1.0)
        
        segment_loss = calculate_dynamic_spoilage(
            base_q10=base_hourly_q10,
            current_temp=temp,
            target_temp=20.0,
            duration_hours=duration,
            multiplier=combined_mult * vibration_mult
        )
        total_loss_pct += segment_loss
        
    return min(total_loss_pct, 100.0)

def score_routes(
    market_price: float,
    yield_qtl: float,
    routes: List[Dict[str, Any]],
    crop: str,
    storage_type: str,
    transport_type: str,
    fuel_cost_per_km: float = 2.0 # INR per km per quintal estimated
) -> List[Dict[str, Any]]:
    """
    Formula: Route_Score (Net Realization) = Market_Price - (Fuel_Cost + Spoilage_Penalty)
    All costs are PER QUINTAL.
    """
    scored_routes = []
    
    for route in routes:
        dist = route.get('distance_km', 0)
        duration = route.get('duration_hours', 0)
        segments = route.get('segments', [])
        
        # 1. Fuel/Logistics Cost
        fuel_cost = dist * fuel_cost_per_km
        
        # 2. Spoilage Penalty
        loss_pct = calculate_path_spoilage(crop, segments, storage_type, transport_type)
        spoilage_penalty = (loss_pct / 100.0) * market_price
        
        # 3. Final Score
        net_realization = market_price - fuel_cost - spoilage_penalty
        
        scored_routes.append({
            **route,
            "fuel_cost_inr": round(fuel_cost, 2),
            "spoilage_penalty_inr": round(spoilage_penalty, 2),
            "quality_loss_pct": round(loss_pct, 2),
            "net_realization_inr": round(net_realization, 2),
            "total_net_profit": round(net_realization * yield_qtl, 2)
        })
        
    # Sort by Net Realization
    scored_routes.sort(key=lambda x: x["net_realization_inr"], reverse=True)
    return scored_routes

def mock_route_alternatives(start: Dict[str, float], end: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Fallback mock router when Mapbox/Google isn't available.
    Generates 3 alternatives: Shortest, Smoothest, Coolest.
    """
    base_dist = calculate_haversine(start['lat'], start['lng'], end['lat'], end['lng'])
    
    return [
        {
            "id": "shortest",
            "name": "Express Highway",
            "distance_km": round(base_dist * 1.05, 1),
            "duration_hours": round((base_dist * 1.05) / 50.0, 1), # Faster
            "segments": [
                {"temp": 34.0, "duration_hours": round((base_dist * 1.05) / 50.0, 2), "vibration_index": 1.0}
            ],
            "description": "Shortest time, but high solar exposure."
        },
        {
            "id": "smoothest",
            "name": "State Highway 4",
            "distance_km": round(base_dist * 1.2, 1),
            "duration_hours": round((base_dist * 1.2) / 40.0, 1),
            "segments": [
                {"temp": 31.0, "duration_hours": round((base_dist * 1.2) / 40.0, 2), "vibration_index": 1.1}
            ],
            "description": "Well-paved, less vibration damage."
        },
        {
            "id": "coolest",
            "name": "Tree-Lined Internal Road",
            "distance_km": round(base_dist * 1.15, 1),
            "duration_hours": round((base_dist * 1.15) / 30.0, 1), # Slower
            "segments": [
                {"temp": 28.0, "duration_hours": round((base_dist * 1.15) / 30.0, 2), "vibration_index": 1.4}
            ],
            "description": "Longer and bumpy, but 6°C cooler shade."
        }
    ]
