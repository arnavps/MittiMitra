from typing import Dict, Any, List
import random

class ColdStoragePartner:
    """
    Mock integration for B2B Cold Storage partners.
    """
    PARTNERS = [
        {"id": "cs_01", "name": "Snowman Logistics", "rate_per_qtl_day": 15.0, "location": "Nashik Outer"},
        {"id": "cs_02", "name": "RK Food Park", "rate_per_qtl_day": 12.5, "location": "Pimpalgaon"},
        {"id": "cs_03", "name": "Sheet Bhandar", "rate_per_qtl_day": 18.0, "location": "Vashi APMC"}
    ]

    @classmethod
    def get_nearest_partner(cls, lat: float, lon: float) -> Dict[str, Any]:
        # In reality, this would use a spatial query. Returning a random one for now.
        return random.choice(cls.PARTNERS)

def calculate_storage_roi(
    yield_qtl: float, 
    market_price: float, 
    current_spoilage_risk: float, 
    storage_days: int = 3
) -> Dict[str, Any]:
    """
    Compares Selling Today vs Storing and Selling Later.
    """
    partner = ColdStoragePartner.get_nearest_partner(0, 0)
    
    # 1. Sell Today
    # We factor in the CURRENT spoilage loss if they sell now (immediate transit)
    sell_today_loss = (current_spoilage_risk / 100.0) * market_price * yield_qtl
    sell_today_revenue = (market_price * yield_qtl) - sell_today_loss
    
    # 2. Store and Sell (B2B Gateway)
    # Assume price recovers by 15% after a crash (Z-score mean reversion)
    expected_future_price = market_price * 1.15 
    storage_cost = partner["rate_per_qtl_day"] * yield_qtl * storage_days
    
    # Cold storage spoilage is minimal (0.5% total for 3 days)
    storage_spoilage_loss = 0.005 * expected_future_price * yield_qtl
    
    store_and_sell_revenue = (expected_future_price * yield_qtl) - storage_cost - storage_spoilage_loss
    
    net_gain = store_and_sell_revenue - sell_today_revenue
    
    return {
        "partner_name": partner["name"],
        "storage_rate": partner["rate_per_qtl_day"],
        "sell_today_net": round(sell_today_revenue, 2),
        "store_and_sell_net": round(store_and_sell_revenue, 2),
        "net_gain_loss": round(net_gain, 2),
        "is_recommended": net_gain > 0,
        "advice": f"Storing for {storage_days} days at {partner['name']} can save you ₹{round(net_gain, 2)} relative to a crashed market sale." if net_gain > 0 else "Market recovery uncertain. Immediate sale might be safer despite high risk."
    }
