from typing import Dict, List, Any
import math

class VehicleClass:
    def __init__(self, name: str, base_cost: float, per_km_cost: float, heat_multiplier: float, capacity_qtl: float, description: str):
        self.name = name
        self.base_cost = base_cost
        self.per_km_cost = per_km_cost
        self.heat_multiplier = heat_multiplier
        self.capacity_qtl = capacity_qtl
        self.description = description

VEHICLE_CLASSES = {
    "Small Pickup": VehicleClass(
        name="Two-Wheeler/Small Pickup",
        base_cost=200.0,
        per_km_cost=8.0,
        heat_multiplier=1.8, # High heat exposure
        capacity_qtl=5.0,
        description="Low cost, high heat exposure. Best for small harvests."
    ),
    "Open Trolley": VehicleClass(
        name="Open Trolley",
        base_cost=500.0,
        per_km_cost=15.0,
        heat_multiplier=1.5, # Medium cost, high ventilation, high solar risk
        capacity_qtl=100.0,
        description="High ventilation, medium solar risk. Good for bulky loads."
    ),
    "Covered Truck": VehicleClass(
        name="Covered Truck",
        base_cost=1200.0,
        per_km_cost=25.0,
        heat_multiplier=0.9, # High cost, low solar risk, potential heat trapping
        capacity_qtl=250.0,
        description="Low solar risk, potential heat trapping. Best for long hauls."
    )
}

def recommend_vehicle(calibrated_yield: float, transit_temp_forecast: float, distance_km: float, market_price: float) -> List[Dict[str, Any]]:
    """
    Logic: Compare three classes:
    1. Two-Wheeler/Small Pickup (Low cost, high heat exposure).
    2. Open Trolley (Medium cost, high ventilation, high solar risk).
    3. Covered/Tarped Truck (High cost, low solar risk, potential heat trapping).
    
    Calculate the Net Realization for each vehicle type.
    """
    recommendations = []
    
    for key, v_class in VEHICLE_CLASSES.items():
        # 1. Transport Cost
        total_cost = v_class.base_cost + (v_class.per_km_cost * distance_km)
        cost_per_qtl = total_cost / max(1.0, calibrated_yield)
        
        # 2. Spoilage Impact (Simplified multiplier approach)
        # Base spoilage constant for this logic
        base_spoilage_rate = 0.02 
        # Temp factor: every 5 degrees above 25 adds 1% base spoilage
        temp_factor = max(1.0, 1.0 + (transit_temp_forecast - 25) / 5.0 * 0.1)
        
        spoilage_pct = base_spoilage_rate * v_class.heat_multiplier * temp_factor
        spoilage_loss_inr = spoilage_pct * market_price
        
        net_realization = market_price - cost_per_qtl - spoilage_loss_inr
        
        recommendations.append({
            "id": key,
            "name": v_class.name,
            "total_cost": round(total_cost, 2),
            "cost_per_q": round(cost_per_qtl, 2),
            "spoilage_risk_pct": round(spoilage_pct * 100, 2),
            "net_realization_per_q": round(net_realization, 2),
            "total_net_profit": round(net_realization * calibrated_yield, 2),
            "description": v_class.description,
            "is_viable": calibrated_yield <= v_class.capacity_qtl * 1.2 # Allow slight overfill
        })
        
    # Sort by total net profit descending
    return sorted(recommendations, key=lambda x: x["total_net_profit"], reverse=True)

def identify_clusters(user_location: Dict[str, float], target_mandi: str) -> List[Dict[str, Any]]:
    """
    Mock clustering logic for Phase 3 shared logistics.
    In a real app, this would query Supabase for other users with similar routes and timing.
    """
    # Mock data for demonstration
    mock_neighbors = [
        {"name": "Ramesh K.", "distance_km": 1.2, "crop": "Tomato", "yield": 45},
        {"name": "Suresh M.", "distance_km": 3.5, "crop": "Onion", "yield": 30},
    ]
    
    savings_per_person = 1500 # Estimated saving if sharing a truck
    
    return {
        "count": len(mock_neighbors),
        "total_savings": len(mock_neighbors) * savings_per_person,
        "savings_per_person": savings_per_person,
        "mandi": target_mandi,
        "neighbors": mock_neighbors
    }

def get_loading_instructions(crop: str, vehicle: str, yield_qtl: float) -> str:
    """
    Agri-Vakeel specialized loading advice.
    """
    crop_lower = crop.lower()
    
    if "potato" in crop_lower or "onion" in crop_lower:
        if "Trolley" in vehicle:
            return f'For your {yield_qtl} Qtl of {crop} in an Open Trolley, stack them in a "Chimney Pattern" with 6-inch gaps to allow the wind to cool the center.'
        else:
            return f'For your {yield_qtl} Qtl of {crop}, ensure bottom layers have straw padding and do not stack more than 4 layers high to prevent bruising.'
            
    if "tomato" in crop_lower:
        return f'Tomatoes must be in plastic crates. Stack crates with interlocking lids. Ensure the highest point of the stack does not exceed the vehicle sideboards to prevent sun-scald.'
        
    return f'Ensure your {crop} is evenely distributed in the {vehicle} to maintain balance and airflow during transit.'
