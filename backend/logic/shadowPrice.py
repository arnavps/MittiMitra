"""
shadowPrice.py
Calculates the 'Shadow Price' — a premium value based on crop quality and freshness.
"""

def calculate_shadow_price(base_price: float, quality_grade: str, spoilage_risk: float) -> dict:
    """
    Shadow_Price = (Live_Mandi_Price) * (Quality_Multiplier)
    
    Rules:
    - Grade A: 1.1x multiplier
    - Grade B: 1.0x multiplier
    - Grade C: 0.9x multiplier (penalty)
    
    Bonus:
    - If Quality is Grade A and Spoilage Risk is < 5%, add 1.1x premium over base.
    """
    multipliers = {
        'A': 1.1,
        'B': 1.0,
        'C': 0.85
    }
    
    base_multiplier = multipliers.get(quality_grade, 0.8)
    
    # Apply extra premium for pristine yield (Grade A + Low Risk)
    if quality_grade == 'A' and spoilage_risk < 5.0:
        base_multiplier = 1.15 # 15% Premium for the best of the best
        
    shadow_price = base_price * base_multiplier
    premium_inr = shadow_price - base_price
    
    return {
        "base_price": round(base_price, 2),
        "shadow_price": round(shadow_price, 2),
        "premium_inr": round(premium_inr, 2),
        "multiplier": base_multiplier,
        "grade": quality_grade,
        "is_premium": premium_inr > 0
    }
