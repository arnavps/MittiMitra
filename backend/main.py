import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from engine.profit_calc import get_net_realization
from engine.map_logic import calculate_spatial_profit
from engine.shock_analyzer import detect_market_shock, detect_volume_shock
from engine.spoilage_pro import calculate_dynamic_spoilage, get_heat_multiplier, get_preservation_actions
from engine.audit import identify_profit_leaks
from integrations.mandi_api import fetch_mandi_prices
from integrations.weather_api import fetch_district_weather
from engine.logistics import recommend_vehicle, identify_clusters

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

app.include_router(chat_router, prefix="/chat", tags=["AI Explanation"])
app.include_router(user_router, prefix="/user", tags=["User Data Management"])
app.include_router(routing_router, prefix="/routing", tags=["Smart Transit Maps"])
app.include_router(copilot_router, prefix="/copilot", tags=["Voice Co-Pilot"])
app.include_router(ecosystem_router, prefix="/ecosystem", tags=["FPO & B2B Ecosystem"])
app.include_router(oracle_router, prefix="/oracle", tags=["Harvest Oracle"])

class HarvestRequest(BaseModel):
    crop: str = ""
    location: dict
    yield_est_quintals: float
    base_spoilage_rate: float = 0.05 # 5% base spoilage
    language: str = "en"
    planting_date: str = None # ISO format
    storage_type: str = "Open Field"
    transport_type: str = "Open Trolley"

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AgriChain backend is running."}

@app.post("/recommendation")
async def get_harvest_recommendation(data: HarvestRequest):
    """
    Core Decision Engine Endpoint.
    1. Fetches weather and mandi info.
    2. Runs profit calc and decay logic.
    3. Runs shock analyzer for Black Swan events.
    4. Integrates Harvest Oracle for maturity-aware tactics.
    """
    try:
        # 1. Fetch Integration Data
        weather_data = await fetch_district_weather(data.location)
        mandi_response = await fetch_mandi_prices(data.crop, data.location, data.language)
        primary_mandi = mandi_response["primary"]
        regional_mandis = mandi_response["regional_options"]
        
        # 1.5 Harvest Oracle Integration (New)
        oracle_window = None
        oracle_verdict = None
        if data.planting_date:
            from engine.oracle import calculate_harvest_window
            from logic.harvestVerdict import calculate_harvest_verdict
            
            oracle_window = calculate_harvest_window(data.planting_date, data.crop)
            oracle_verdict = calculate_harvest_verdict(
                maturity_percentage=int(oracle_window["current_maturity_pct"]),
                sync_panic_days=[], # TODO: Pass actual heatmap if available
                weather_forecast=[], # TODO: Pass actual forecast
                crop=data.crop
            )
        
        # 2. Risk & Shock Analysis (on Primary Mandi)
        price_shock = detect_market_shock(primary_mandi["current_price"], primary_mandi["7_day_history"])
        volume_shock = detect_volume_shock(primary_mandi["current_volume_quintals"], primary_mandi["average_volume_quintals"])
        
        # Determine if there's any active shock
        active_shock = None
        if price_shock["is_shock"]:
            active_shock = price_shock
        elif volume_shock["is_shock"]:
            active_shock = volume_shock
        elif weather_data["rain_probability_percent"] > 80:
             active_shock = {
                "status": "WEATHER_SHOCK",
                "message": "Heavy rain > 80% probability in next 2 hours!",
                "is_shock": True,
                "pivot_advice": "EMERGENCY: Cover your produce immediately or delay transit!"
            }

        # 3. Spatial Profit Analysis (Map Logic)
        temp_today = weather_data["temperature_c"]
        humidity_today = weather_data["humidity_percent"]
        soil_moisture_today = weather_data.get("soil_moisture_percent", 45.0) # Real satellite data
        
        # Calculate logistics and profit for ALL regional options
        spatial_profits = calculate_spatial_profit(
            crop=data.crop,
            yield_est=data.yield_est_quintals,
            temp_c=temp_today,
            humidity=humidity_today,
            available_mandis=regional_mandis
        )
        
        best_overall_mandi = spatial_profits[0]
        
        dist = primary_mandi["distance_km"]
        
        # Calculate for TODAY (Assume 2 hours shelf/transit time to primary)
        estimated_transit_hours = 2.0
        profit_today = get_net_realization(
            market_price=primary_mandi["current_price"],
            crop_type=data.crop,
            distance_km=dist,
            temp_c=temp_today,
            humidity=humidity_today,
            hours_to_market=estimated_transit_hours,
            yield_est=data.yield_est_quintals
        )
        
        # Calculate for 48 HOURS (Assume 50 hours shelf/transit time total)
        price_forecast_48h = primary_mandi["current_price"] * 1.05 
        temp_forecast_48h = temp_today + 2.0 
        
        profit_48h = get_net_realization(
            market_price=price_forecast_48h,
            crop_type=data.crop,
            distance_km=primary_mandi["distance_km"], # Forecast is usually for the nearest/default market
            temp_c=temp_forecast_48h,
            humidity=humidity_today,
            hours_to_market=50.0,
            yield_est=data.yield_est_quintals
        )
        
        # 3.5 UNIFIED DECISION LOGIC: Pick the absolute BEST market today
        if not spatial_profits:
            # Emergency fallback if no regional options pass filters
            best_optimal_option = {
                "mandi_name": primary_mandi["name"],
                "distance_km": primary_mandi["distance_km"],
                "market_price": primary_mandi["current_price"],
                "quality_loss_pct": 2.0,
                "total_net_profit": primary_profit
            }
        else:
            best_optimal_option = spatial_profits[0]
        
        profit_today = best_optimal_option.get("net_profit_per_quintal", profit_today)
        total_profit_today = best_optimal_option.get("total_net_profit", profit_today * data.yield_est_quintals)
        best_mandi_name = best_optimal_option["mandi_name"]
        dist_best = best_optimal_option["distance_km"]
        
        gross_rev = best_optimal_option["market_price"] * data.yield_est_quintals
        logistics_cost = dist_best * 15.0 
        spoilage_penalty = (best_optimal_option["quality_loss_pct"] / 100.0) * gross_rev
        
        # 3.8 Preservation Engine Integration
        storage_multiplier = get_heat_multiplier(data.storage_type)
        transport_multiplier = get_heat_multiplier(data.transport_type)
        
        base_hourly_q10 = 0.005 # Base decay rate per hour at optimal temp (e.g. 0.5%)
        target_temp = 20.0 # Standard cool temp
        
        # Calculate Dynamic Spoilage for next 48 hours for display
        # Simplified: We use the 48h temp forecast
        dynamic_spoilage_pct = calculate_dynamic_spoilage(
            base_q10=base_hourly_q10, 
            current_temp=temp_forecast_48h, 
            target_temp=target_temp, 
            duration_hours=48.0, 
            multiplier=(storage_multiplier + transport_multiplier)/2
        )
        
        # Combine initial spatial decay logic with our new dynamic heat multiplier
        quality_loss_pct = min(100.0, best_optimal_option["quality_loss_pct"] * storage_multiplier)
        spoilage_penalty = (quality_loss_pct / 100.0) * gross_rev
        
        # Calculate Total Crop Value for Preservation Math
        total_crop_value = gross_rev
        preservation_data = get_preservation_actions(total_crop_value, quality_loss_pct, temp_today, data.storage_type)
        
        # Phase 1.5: Logistics Audit & Profit Leaks
        current_state = {
            "storage_environment": data.storage_type,
            "vehicle_type": data.transport_type
        }
        market_price_per_qtl = best_optimal_option["market_price"]
        audit_data = identify_profit_leaks(current_state, data.crop, temp_today, data.yield_est_quintals, market_price_per_qtl)

        # Re-calc net profit with updated spoilage
        total_profit_today = gross_rev - logistics_cost - spoilage_penalty
        profit_today = total_profit_today / data.yield_est_quintals
        
        # 4. Synthesize Final Recommendation & Routing Pivot
        is_selling_optimal = profit_today >= profit_48h
        status = "GREEN" if is_selling_optimal else "RED"
        
        # 4.5 UNIFIED OVERRIDE: Maturity Protection
        # If crop is too young (<85%), force WAIT unless Oracle says SELL (Strategic Exit)
        if oracle_window and oracle_window["current_maturity_pct"] < 85:
            if oracle_verdict and oracle_verdict["verdict"] != "SELL":
                 status = "RED" # Force WAIT for growth
                 active_shock = active_shock or {
                     "status": "MATURITY_LOCK",
                     "is_shock": False, # Just a logical lock
                     "message": "Crop is still in growth phase. Harvesting now causes significant yield loss.",
                     "pivot_advice": f"Wait {oracle_window['days_to_peak']} days for peak weight. Oracle recommends HOLD."
                 }
                 
        # If Oracle says SELL (Strategic Early Exit), override to GREEN
        if oracle_verdict and oracle_verdict["verdict"] == "SELL":
            status = "GREEN"
        
        pivot_mandi = None
        
        # Alternative Destination Discovery Trigger
        if active_shock:
            status = "RED" # Shocks always override to RED/WAIT for primary
            
            # Find the primary market's profit explicitly to calculate savings
            primary_profit = 0
            for option in spatial_profits:
                if option["mandi_name"] == primary_mandi["name"]:
                    primary_profit = option["total_net_profit"]
                    break
            
            # Find the best alternative that IS NOT the primary mandi
            for option in spatial_profits:
                if option["mandi_name"] != primary_mandi["name"] and not option.get("is_dead_zone"):
                    pivot_mandi = option
                    break
            
            if pivot_mandi:
                 savings = max(0, pivot_mandi['total_net_profit'] - primary_profit)
                 # Refined phrasing for voice navigation co-pilot
                 active_shock["pivot_advice"] = f"Warning: Prices at {primary_mandi['name']} just fell. Rerouting to {pivot_mandi['mandi_name']} to save ₹{int(savings)}."
                 active_shock["pivot_mandi"] = pivot_mandi
                 active_shock["savings_inr"] = savings
            
        recommendation = {
            "status": status,
            "net_realization_inr_per_quintal": round(profit_today, 2),
            "total_net_profit": round(total_profit_today, 2),
            "yield_quintals": data.yield_est_quintals,
            "breakdown": {
                "gross_revenue": round(gross_rev, 2),
                "logistics_cost": round(logistics_cost, 2),
                "spoilage_penalty": round(spoilage_penalty, 2),
                "quality_loss_pct": round(best_optimal_option["quality_loss_pct"], 2)
            },
            "profit_forecast_48h": round(profit_48h, 2),
            "best_mandi": f"{best_mandi_name} ({round(dist_best, 1)} km)",
            "weather": weather_data,
            "preservation": preservation_data,
            "logistics_audit": audit_data,
            "spoilage_risk_pct": round(dynamic_spoilage_pct, 2),
            "mandi_stats": {
                "name": best_mandi_name,
                "current_price": best_optimal_option["market_price"],
                "distance_km": dist_best,
                "quality_loss_pct": best_optimal_option["quality_loss_pct"]
            },
            "shock_alert": active_shock,
            "regional_options": spatial_profits, # Send all map data for the Market Maps tab
            "decay_metrics": {
                "quality_loss_applied_pct": round(quality_loss_pct, 2),
                "today_profit": round(profit_today, 2),
                "future_profit": round(profit_48h, 2),
                "profit_difference": round(profit_today - profit_48h, 2)
            },
            "logistics_recommendations": recommend_vehicle(
                calibrated_yield=data.yield_est_quintals,
                transit_temp_forecast=temp_forecast_48h,
                distance_km=dist_best,
                market_price=best_optimal_option["market_price"]
            ),
            "shared_logistics": identify_clusters(
                user_location=data.location,
                target_mandi=best_mandi_name
            ),
            "oracle": {
                "maturity": oracle_window,
                "verdict": oracle_verdict
            }
        }
        
        # Add AI brief after recommendation is formed
        recommendation["vakeel_brief"] = generate_vakeel_brief(recommendation, data.language)
        
        return recommendation

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
