import sys
import os

# Add backend directory to sys.path to import directly
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from engine.decay_logic import calculate_quality_loss
from engine.profit_calc import get_net_realization
from engine.spoilage_pro import calculate_dynamic_spoilage

print("---- Testing calculate_quality_loss ----")
loss_pct = calculate_quality_loss("Tomato", 30.0, 50.0, 5.0)
print(f"Tomatoes at 30C for 5 hours: {loss_pct}% loss")

print("\n---- Testing calculate_dynamic_spoilage ----")
dynamic_loss_pct = calculate_dynamic_spoilage(base_q10=0.005, current_temp=30.0, target_temp=20.0, duration_hours=48.0, multiplier=1.5)
print(f"Tomatoes dynamic loss (30C, 48hrs, 1.5x multiplier): {dynamic_loss_pct}% loss")

print("\n---- Testing net_realization ----")
net_profit = get_net_realization(
    market_price=3000.0, 
    crop_type="Tomato", 
    distance_km=100.0, 
    temp_c=30.0, 
    humidity=50.0, 
    hours_to_market=5.0, 
    yield_est=10.0
)
print(f"Net realization per quintal: {net_profit}")
