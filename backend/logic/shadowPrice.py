"""
shadowPrice.py
Calculates the 'Shadow Price' — a premium value based on crop quality and freshness.
"""

def calculate_shadow_price(base_price: float, quality_grade: str, spoilage_risk: float, severity_index: float = 0.0) -> dict:
    """
    Shadow_Price = (Live_Mandi_Price) * (Quality_Multiplier) * (1 - Disease_Penalty)
    
    Rules:
    - Grade A: 1.1x multiplier
    - Grade B: 1.0x multiplier
    - Grade C: 0.85x multiplier (penalty)
    
    Bonus:
    - If Quality is Grade A and Spoilage Risk is < 5% and no disease, add 1.15x premium.
    
    Pathological Penalty:
    - Deduct price based on severity_index (0.0 to 1.0).
    - Penalty = Severity * 0.5 (Max 50% reduction for total infection).
    """
    multipliers = {
        'A': 1.1,
        'B': 1.0,
        'C': 0.85
    }
    
    # Shadow_Price = (Live_Mandi_Price) * (Quality_Multiplier)
    base_multiplier = multipliers.get(quality_grade, 0.8)
    
    # Rule: If Grade-A and <5% spoilage, ensure 1.1x premium (already handled by multipliers but explicit here)
    if quality_grade == 'A' and spoilage_risk < 5.0 and severity_index < 0.1:
        base_multiplier = 1.10 
        
    # Calculate price
    shadow_price = base_price * base_multiplier
    
    # Pathological Penalty (if any)
    disease_penalty_multiplier = 1.0 - (severity_index * 0.5)
    final_price = shadow_price * disease_penalty_multiplier
    
    premium_inr = final_price - base_price
    
    return {
        "base_price": round(base_price, 2),
        "shadow_price": round(final_price, 2),
        "premium_inr": round(premium_inr, 2),
        "multiplier": round(base_multiplier * disease_penalty_multiplier, 3),
        "grade": quality_grade,
        "is_premium": premium_inr > 0,
        "severity_penalty": round(1.0 - disease_penalty_multiplier, 2)
    }
