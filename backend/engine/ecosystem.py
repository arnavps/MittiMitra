from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timedelta
from engine.logistics import VEHICLE_CLASSES

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine formula to calculate the distance between two points on Earth.
    """
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_nearby_logistics_matches(
    current_user_lat: float, 
    current_user_lon: float, 
    target_mandi: str, 
    harvest_date: str,
    radius_km: float = 10.0
) -> Dict[str, Any]:
    """
    Scans for other farmers with similar target mandis and harvest dates.
    In a production app, this would query Supabase table 'farm_sessions'.
    """
    
    # Mock Data: In reality, this would be a Supabase query:
    # supabase.table('farm_sessions').select('*').eq('target_mandi', target_mandi).eq('harvest_date', harvest_date)
    mock_sessions = [
        {"id": "user_2", "name": "Ramesh K.", "lat": current_user_lat + 0.02, "lon": current_user_lon + 0.01, "yield_qtl": 45},
        {"id": "user_3", "name": "Suresh M.", "lat": current_user_lat - 0.01, "lon": current_user_lon + 0.03, "yield_qtl": 30},
        {"id": "user_4", "name": "Anil P.", "lat": current_user_lat + 0.05, "lon": current_user_lon - 0.02, "yield_qtl": 60},
    ]

    nearby_matches = []
    total_yield_cluster = 0.0

    for session in mock_sessions:
        dist = calculate_distance(current_user_lat, current_user_lon, session["lat"], session["lon"])
        if dist <= radius_km:
            nearby_matches.append({
                "name": session["name"],
                "distance_km": round(dist, 1),
                "yield_qtl": session["yield_qtl"]
            })
            total_yield_cluster += session["yield_qtl"]

    return {
        "matches": nearby_matches,
        "total_neighbors": len(nearby_matches),
        "cluster_yield": total_yield_cluster
    }

def calculate_shared_logistics_roi(
    user_yield: float,
    neighbor_yield: float,
    distance_km: float,
    market_price: float
) -> Dict[str, Any]:
    """
    Calculates savings: 1x Covered Truck (Shared) vs 2x Small Pickups (Individual).
    """
    total_yield = user_yield + neighbor_yield
    
    # Individual Costs (Small Pickup)
    pickup = VEHICLE_CLASSES["Small Pickup"]
    # User alone might need multiple trips if yield > capacity, but usually pickup is 5qtl.
    # For 50qtl, user needs 10 trips.
    user_trips = math.ceil(user_yield / pickup.capacity_qtl)
    user_individual_cost = (pickup.base_cost + (pickup.per_km_cost * distance_km)) * user_trips
    
    # Neighbor individual cost (simplified match)
    neighbor_trips = math.ceil(neighbor_yield / pickup.capacity_qtl)
    neighbor_individual_cost = (pickup.base_cost + (pickup.per_km_cost * distance_km)) * neighbor_trips
    
    total_individual_cost = user_individual_cost + neighbor_individual_cost
    
    # Shared Cost (Covered Truck) - Capacity 250qtl
    truck = VEHICLE_CLASSES["Covered Truck"]
    shared_total_cost = truck.base_cost + (truck.per_km_cost * distance_km)
    
    # Spoilage Impact (Truck is better for heat - multiplier 0.9 vs 1.8)
    # We assume a standard temp factor of 1.1 for this ROI calculation
    temp_factor = 1.1
    individual_spoilage_pct = 0.02 * pickup.heat_multiplier * temp_factor
    truck_spoilage_pct = 0.02 * truck.heat_multiplier * temp_factor
    
    individual_loss = total_yield * market_price * individual_spoilage_pct
    shared_loss = total_yield * market_price * truck_spoilage_pct
    
    total_individual_roi = (total_yield * market_price) - total_individual_cost - individual_loss
    total_shared_roi = (total_yield * market_price) - shared_total_cost - shared_loss
    
    total_savings = total_shared_roi - total_individual_roi
    
    return {
        "individual_cost": round(total_individual_cost, 2),
        "shared_cost": round(shared_total_cost, 2),
        "total_savings": round(total_savings, 2),
        "savings_per_person": round(total_savings / 2, 2),
        "spoilage_reduction_pct": round((individual_spoilage_pct - truck_spoilage_pct) * 100, 2),
        "is_profitable": total_savings > 0
    }
