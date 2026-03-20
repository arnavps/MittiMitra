import os
import json
import logging
import asyncio
import httpx
from datetime import datetime
from integrations.mandi_api import fetch_mandi_prices

logger = logging.getLogger(__name__)

async def sync_all_commodities():
    """
    Background task to refresh all primary commodities from live government sources.
    """
    commodities = ["Cotton", "Tomato", "Potato", "Onion", "Soybean", "Wheat", "Rice"]
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "mandi_prices_real.json")
    
    try:
        with open(json_path, "r") as f:
            db = json.load(f)
        
        updated_count = 0
        for crop in commodities:
            logger.info(f"Syncing {crop}...")
            # Attempt to fetch from data.gov.in directly
            api_key = "579b464db66ec23bdd0000018f6d2aeef8304ec27142be2cf3ef3688"
            url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit=10&filters[commodity]={crop.upper()}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    records = data.get("records", [])
                    if records:
                        # Extract fresh prices and update the local DB entry
                        new_markets = []
                        total_price = 0
                        for rec in records:
                            price = float(rec.get("modal_price", 0))
                            if price > 0:
                                new_markets.append({
                                    "name": rec.get("market"),
                                    "price": price,
                                    "lat": float(rec.get("lat", 0)) if rec.get("lat") else None,
                                    "lng": float(rec.get("lon", 0)) if rec.get("lon") else None
                                })
                                total_price += price
                        
                        if new_markets:
                            db["commodities"][crop.lower()]["markets"] = new_markets
                            db["commodities"][crop.lower()]["modal_price"] = total_price / len(new_markets)
                            updated_count += 1
        
        db["updated_at"] = datetime.utcnow().isoformat() + "Z"
        with open(json_path, "w") as f:
            json.dump(db, f, indent=4)
            
        logger.info(f"Successfully synced {updated_count} commodities automatically.")
    except Exception as e:
        logger.error(f"Auto-sync failed: {e}")

async def start_periodic_sync():
    while True:
        await sync_all_commodities()
        await asyncio.sleep(3600) # Sync every hour
