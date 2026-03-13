from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from engine.copilot import check_thermal_safety, detect_market_price_drop, find_emergency_reroute

router = APIRouter()

class ThermalCheckRequest(BaseModel):
    crop: str
    current_temp: float
    path_forecasts: List[Dict[str, float]]
    remaining_hours: float

class PriceDropRequest(BaseModel):
    current_price: float
    historical_prices: List[float]
    z_threshold: float = 1.5

class RerouteRequest(BaseModel):
    current_lat: float
    current_lng: float
    crop: str
    yield_qtl: float
    available_mandis: List[Dict[str, Any]]
    current_target_mandi_id: str

@router.post("/thermal-check")
async def thermal_check(data: ThermalCheckRequest):
    return check_thermal_safety(data.crop, data.current_temp, data.path_forecasts, data.remaining_hours)

@router.post("/price-drop-check")
async def price_drop_check(data: PriceDropRequest):
    return detect_market_price_drop(data.current_price, data.historical_prices, data.z_threshold)

@router.post("/find-reroute")
async def find_reroute(data: RerouteRequest):
    reroute = find_emergency_reroute(
        data.current_lat, 
        data.current_lng, 
        data.crop, 
        data.yield_qtl, 
        data.available_mandis, 
        data.current_target_mandi_id
    )
    if not reroute:
        return {"found": False, "message": "No better alternative Mandis found within emergency radius."}
    return {"found": True, "reroute": reroute}
