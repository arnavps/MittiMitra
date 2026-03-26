import math

def calculate_quality_loss(crop_type: str, temp: float, humidity: float, hours_passed: float) -> float:
    """
    MittiMitra Optimization Formula: Decay Function.
    Calculates percentage of quality loss using Q10 coefficient.
    
    Q10 Calculation: Rate doubles every 10C.
    Formula: R2 = R1 * Q10^((T2-T1)/10)
    Base condition: T1 = 20C.
    """
    Q10 = 2.0
    T_BASE = 20.0
    
    # Crop-specific baseline decay rates (loss per hour at 20C)
    # Perishables lose quality fast; non-perishables are durable.
    DECAY_RATES = {
        # High Perishables (Fruit & Veg)
        "Tomato": 0.005,      # 0.5% per hour
        "Grapes": 0.006,      # Very high
        "Strawberries": 0.008,
        
        # Medium Perishables (Roots & Bulbs)
        "Onion": 0.001,       # 0.1% per hour
        "Potato": 0.0005,
        "Garlic": 0.0004,
        
        # Durables (Grains, Pulses, Fibers)
        "Cotton": 0.00001,    # Virtually zero loss over days
        "Wheat": 0.00002,     
        "Rice": 0.00002,
        "Soybean": 0.00003,
        "Maize": 0.00003,
        "Mustard": 0.00002,
    }
    
    # Standardize input for lookup
    lookup_crop = crop_type.title().strip()
    
    # Default to 0.0001 (Safe Durable) if unknown, to prevent panic for grains
    # But if user says "Tomato" or similar, it uses the high rate
    base_rate = DECAY_RATES.get(lookup_crop, 0.0001)
    
    # Standard Q10 exponential decay
    relative_rate = math.pow(Q10, (temp - T_BASE) / 10.0)
    
    # High-temperature acceleration logic for perishables
    if temp > 30 and base_rate > 0.0001:
        high_temp_multiplier = 1.0 + ((temp - 30) * 0.10)
        relative_rate *= high_temp_multiplier
        
    quality_loss_ratio = base_rate * relative_rate * hours_passed
    quality_loss_pct = quality_loss_ratio * 100.0
    
    # Cap loss at 100.0 (100%)
    return min(100.0, quality_loss_pct)
