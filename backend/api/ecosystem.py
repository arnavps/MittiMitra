from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engine.ecosystem import find_nearby_logistics_matches, calculate_shared_logistics_roi
from integrations.storage_api import calculate_storage_roi

router = APIRouter()

class ClusterRequest(BaseModel):
    lat: float
    lon: float
    target_mandi: str
    harvest_date: str
    user_yield_qtl: float
    market_price: float

@router.post("/cluster")
def get_logistics_clusters(req: ClusterRequest):
    """
    Finds nearby logistics matches and calculates potential savings.
    """
    try:
        # 1. Find neighbors
        cluster_data = find_nearby_logistics_matches(
            req.lat, req.lon, req.target_mandi, req.harvest_date
        )
        
        # 2. If neighbors found, calculate ROI for the first one as a sample
        savings_info = None
        if cluster_data["total_neighbors"] > 0:
            primary_neighbor = cluster_data["matches"][0]
            savings_info = calculate_shared_logistics_roi(
                user_yield=req.user_yield_qtl,
                neighbor_yield=primary_neighbor["yield_qtl"],
                distance_km=primary_neighbor["distance_km"],
                market_price=req.market_price
            )
            
        return {
            "cluster": cluster_data,
            "savings_analysis": savings_info,
            "vakeel_alert": f"Alert: {cluster_data['total_neighbors']} neighbors found! Share a truck to Vashi to save ₹{savings_info['savings_per_person'] if savings_info else 0}." if cluster_data["total_neighbors"] > 0 else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StorageROIRequest(BaseModel):
    yield_qtl: float
    market_price: float
    current_spoilage_risk: float
    storage_days: int = 3

@router.post("/storage-roi")
def get_storage_roi(req: StorageROIRequest):
    """
    Calculates the ROI of using cold storage vs selling today.
    """
    try:
        roi = calculate_storage_roi(
            req.yield_qtl, req.market_price, req.current_spoilage_risk, req.storage_days
        )
        return roi
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
