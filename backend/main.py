import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging 

import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from engine.profit_calc import get_net_realization
from engine.map_logic import calculate_spatial_profit
from engine.shock_analyzer import detect_market_shock, detect_volume_shock
from engine.spoilage_pro import predict_post_harvest_spoilage, get_heat_multiplier
from engine.audit import identify_profit_leaks
from logic.shadowPrice import calculate_shadow_price
from integrations.mandi_api import fetch_mandi_prices
from integrations.weather_api import fetch_district_weather
from engine.logistics import calculate_logistics_cost, recommend_vehicle, identify_clusters
from engine.scheme_ranker import rank_schemes

app = FastAPI(title="AgriChain API", description="The Temporal Arbitrage Engine")

# Configure CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.chat import router as chat_router, generate_vakeel_brief
from api.user import router as user_router
from api.routing import router as routing_router
from api.copilot import router as copilot_router
from api.ecosystem import router as ecosystem_router
from api.oracle import router as oracle_router
from api.community import router as community_router

app.include_router(chat_router, prefix="/chat", tags=["AI Explanation"])
app.include_router(user_router, prefix="/user", tags=["User Data Management"])
app.include_router(routing_router, prefix="/routing", tags=["Smart Transit Maps"])
app.include_router(copilot_router, prefix="/copilot", tags=["Voice Co-Pilot"])
app.include_router(ecosystem_router, prefix="/ecosystem", tags=["FPO & B2B Ecosystem"])
app.include_router(oracle_router, prefix="/oracle", tags=["Harvest Oracle"])
app.include_router(community_router, prefix="/community", tags=["Farmer Community"])

import asyncio
@app.on_event("startup")
async def startup_event():
    # Start the automated market data synchronization in the background
    from logic.market_sync import sync_all_commodities, start_periodic_sync
    # Run one sync immediately in background
    asyncio.create_task(sync_all_commodities())
    # Start periodic loop
    asyncio.create_task(start_periodic_sync())
    logger.info("Market Data Automator initialized.")

class HarvestRequest(BaseModel):
    crop: str = ""
    location: dict
    yield_est_quintals: float = 50.0
    base_spoilage_rate: float = 0.05 
    language: str = "en"
    planting_date: str = None 
    storage_type: str = "Open Field"
    transport_type: str = "Open Trolley"
    disease_severity: float = 0.0
    is_harvested: bool = False

async def get_area_name(lat: float, lng: float) -> str:
    """Resolves coordinates to a city/district name using Nominatim."""
    headers = {"User-Agent": "MittiMitra-Decision-Engine-v2/1.0"}
    for zoom in [16, 18, 14]:
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom={zoom}"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    addr = data.get("address", {})
                    potential_keys = ["village", "town", "neighbourhood", "locality", "suburb"]
                    for key in potential_keys:
                        val = addr.get(key)
                        if val and "Ward" not in val:
                            return val
        except: pass
    return "Your Area"

@app.post("/recommendation")
async def get_harvest_recommendation(data: HarvestRequest):
    try:
        # 1. Fetch Data
        weather_data = await fetch_district_weather(data.location)
        mandi_response = await fetch_mandi_prices(data.crop, data.location, data.language)
        primary_mandi = mandi_response["primary"]
        regional_mandis = mandi_response["regional_options"]
        
        temp_today = float(weather_data["temperature_c"])
        humidity_today = float(weather_data.get("humidity_percent", 60.0))

        # 1.5 Oracle
        oracle_window = None
        oracle_verdict = None
        if data.planting_date and not data.is_harvested:
            from engine.oracle import calculate_harvest_window
            from logic.harvestVerdict import calculate_harvest_verdict
            oracle_window = calculate_harvest_window(data.planting_date, data.crop)
            oracle_verdict = calculate_harvest_verdict(
                maturity_percentage=int(oracle_window["current_maturity_pct"]),
                sync_panic_days=[],
                weather_forecast=weather_data.get("forecast", []),
                crop=data.crop
            )
        
        # 2. Shocks
        price_shock = detect_market_shock(primary_mandi["current_price"], primary_mandi["7_day_history"])
        volume_shock = detect_volume_shock(primary_mandi["current_volume_quintals"], primary_mandi["average_volume_quintals"])
        active_shock = price_shock if price_shock["is_shock"] else (volume_shock if volume_shock["is_shock"] else None)
        
        if not active_shock and weather_data.get("rain_probability_percent", 0) > 80:
             active_shock = {
                "status": "WEATHER_SHOCK",
                "message": "Heavy rain > 80% probability!",
                "is_shock": True,
                "pivot_advice": "EMERGENCY: Cover produce immediately!"
            }

        # 3. Spatial Profit Analysis
        spatial_profits = calculate_spatial_profit(
            crop=data.crop,
            yield_est=data.yield_est_quintals,
            temp_c=temp_today,
            humidity=humidity_today,
            available_mandis=regional_mandis
        )
        
        best_optimal_option = spatial_profits[0] if spatial_profits else {
            "mandi_name": primary_mandi["name"],
            "distance_km": primary_mandi["distance_km"],
            "market_price": primary_mandi["current_price"],
            "quality_loss_pct": 2.0,
            "total_net_profit": 0
        }
        
        best_mandi_name = best_optimal_option["mandi_name"]
        dist_best = best_optimal_option["distance_km"]

        # 3. Dynamic Spoilage
        spoilage_results = predict_post_harvest_spoilage(
            crop=data.crop,
            temp=temp_today,
            humidity=humidity_today,
            hours_to_market=dist_best / 40.0
        )
        dynamic_spoilage_pct = spoilage_results["loss_percentage"]
        preservation_data = spoilage_results["preservation"]

        # Costs & Profits
        gross_rev = data.yield_est_quintals * best_optimal_option["market_price"]
        logistics_cost = calculate_logistics_cost(data.yield_est_quintals, dist_best, data.transport_type)
        spoilage_penalty = (dynamic_spoilage_pct / 100.0) * gross_rev
        total_profit_today = gross_rev - logistics_cost - spoilage_penalty
        profit_today = total_profit_today / data.yield_est_quintals
        
        # Forecast 48h (Mocked based on trend)
        profit_48h = profit_today * 0.95 # Usually wait is worse due to decay

        # 4. Final Recommendation
        status = "GREEN" if profit_today >= profit_48h else "RED"
        source_area = await get_area_name(data.location["lat"], data.location["lng"])

        if not data.is_harvested and oracle_window and oracle_window["current_maturity_pct"] < 85:
            if oracle_verdict and oracle_verdict["verdict"] != "SELL":
                 status = "RED"
                 active_shock = active_shock or {
                     "status": "MATURITY_LOCK",
                     "is_shock": False,
                     "message": "Crop still growing.",
                     "pivot_advice": f"Wait {oracle_window['days_to_peak']} days."
                 }
        
        if oracle_verdict and oracle_verdict["verdict"] == "SELL":
             status = "GREEN"

        if active_shock:
            status = "RED"
            primary_profit = 0
            for opt in spatial_profits:
                if opt["mandi_name"] == primary_mandi["name"]:
                    primary_profit = opt["total_net_profit"]
                    break
            
            pivot_mandi = next((o for o in spatial_profits if o["mandi_name"] != primary_mandi["name"]), None)
            if pivot_mandi:
                 savings = max(0, pivot_mandi['total_net_profit'] - primary_profit)
                 active_shock["pivot_advice"] = f"Warning: Rerouting to {pivot_mandi['mandi_name']} to save INR {int(savings)}."
                 active_shock["pivot_mandi"] = pivot_mandi
            
        recommendation = {
            "status": status,
            "source_area": source_area,
            "net_realization_inr_per_quintal": round(profit_today, 2),
            "total_net_profit": round(total_profit_today, 2),
            "yield_quintals": data.yield_est_quintals,
            "transport_type": data.transport_type,
            "storage_type": data.storage_type,
            "breakdown": {
                "gross_revenue": round(gross_rev, 2),
                "logistics_cost": round(logistics_cost, 2),
                "spoilage_penalty": round(spoilage_penalty, 2),
                "quality_loss_pct": round(dynamic_spoilage_pct, 2)
            },
            "profit_forecast_48h": round(profit_48h, 2),
            "best_mandi": f"{best_mandi_name} ({round(dist_best, 1)} km)",
            "shock_alert": active_shock,
            "weather": weather_data,
            "preservation": preservation_data,
            "logistics_audit": identify_profit_leaks({"storage_environment": data.storage_type, "vehicle_type": data.transport_type}, data.crop, temp_today, data.yield_est_quintals, best_optimal_option["market_price"]),
            "spoilage_risk_pct": round(dynamic_spoilage_pct, 2),
            "mandi_stats": {
                "name": best_mandi_name,
                "current_price": best_optimal_option["market_price"],
                "distance_km": dist_best,
                "quality_loss_pct": best_optimal_option["quality_loss_pct"]
            },
            "regional_options": spatial_profits,
            "decay_metrics": {
                "quality_loss_applied_pct": round(dynamic_spoilage_pct, 2),
                "today_profit": round(profit_today, 2),
                "future_profit": round(profit_48h, 2),
                "profit_difference": round(profit_today - profit_48h, 2)
            },
            "logistics_recommendations": recommend_vehicle(data.yield_est_quintals, [temp_today, temp_today+1, temp_today+2], dist_best, best_optimal_option["market_price"]),
            "shared_logistics": identify_clusters(data.location, best_mandi_name, data.crop),
            "oracle": {"maturity": oracle_window, "verdict": oracle_verdict}
        }
        
        recommendation["vakeel_brief"] = generate_vakeel_brief(recommendation, data.language)
        return recommendation

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"CRITICAL: Engine Failed: {str(e)}")
        return {"status": "GRAY", "error_mode": True, "message": "Engine recovery in progress."}

@app.post("/schemes")
async def get_ranked_schemes(data: dict):
    return rank_schemes(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
