from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from engine.oracle import calculate_harvest_window

router = APIRouter()

class OracleRequest(BaseModel):
    planting_date: str
    crop: str

@router.post("/forecast")
def get_harvest_forecast(req: OracleRequest):
    """
    Returns the estimated harvest window and maturity percentage.
    """
    try:
        forecast = calculate_harvest_window(req.planting_date, req.crop)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
