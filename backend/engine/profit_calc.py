from .decay_logic import calculate_quality_loss

def get_net_realization(
    market_price: float, 
    crop_type: str,
    distance_km: float, 
    temp_c: float, 
    humidity: float, 
    hours_to_market: float,
    yield_est: float = 1.0, 
    transport_cost_per_km: float = 15.0 # Baseline INR/km for small transport
) -> float:
    """
    MittiMitra Optimization Formula: Net Realization Logic.
    Formula: Net Realization = Market Price - (Transport Cost / Yield) - Quality Loss
    """
    # 1. Transport Cost per quintal
    # total_trip_cost = distance_km * transport_cost_per_km
    # transport_per_quintal = total_trip_cost / yield_est
    transport_per_quintal = (distance_km * transport_cost_per_km) / max(1.0, yield_est)
    
    # Add a heavy penalty for distances > 250km to discourage unrealistic cross-country transport for smallholders
    if distance_km > 250:
        transport_per_quintal += (distance_km - 250) * (transport_cost_per_km * 1.5) / max(1.0, yield_est)

    # 2. Quality Loss (Spoilage penalty in INR)
    # Note: calculate_quality_loss returns a percentage (0.0 to 100.0)
    loss_pct = calculate_quality_loss(crop_type, temp_c, humidity, hours_to_market)
    quality_loss_inr = (loss_pct / 100.0) * market_price
    
    # 3. Final Calculation
    net_realization = market_price - transport_per_quintal - quality_loss_inr
    
    return round(net_realization, 2)
