from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engine.oracle import calculate_harvest_window
from logic.harvestVerdict import calculate_harvest_verdict

router = APIRouter()

class OracleRequest(BaseModel):
    planting_date: str
    crop: str
    sync_panic_days: List[Dict[str, Any]] = []
    weather_forecast: List[Dict[str, Any]] = []

@router.post("/forecast")
def get_harvest_forecast(req: OracleRequest):
    """
    Returns the estimated harvest window, maturity percentage, and tactical verdict.
    """
    try:
        # 1. Base maturity data
        base_forecast = calculate_harvest_window(req.planting_date, req.crop)
        
        # 2. Decision Matrix Verdict
        verdict_data = calculate_harvest_verdict(
            maturity_percentage=int(base_forecast["current_maturity_pct"]),
            sync_panic_days=req.sync_panic_days,
            weather_forecast=req.weather_forecast,
            crop=req.crop
        )
        
        return {
            **base_forecast, 
            "oracle_verdict": verdict_data,
            "tactical_context": {
                "sync_panic_days": req.sync_panic_days,
                "weather_forecast": req.weather_forecast
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
