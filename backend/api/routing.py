from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from engine.routing import mock_route_alternatives, score_routes

router = APIRouter()

class RoutingRequest(BaseModel):
    crop: str
    start_loc: Dict[str, float] # {"lat": ..., "lng": ...}
    end_loc: Dict[str, float]
    yield_qtl: float
    storage_type: str
    transport_type: str
    market_price: float

@router.post("")
async def get_optimal_route(req: RoutingRequest):
    """
    Returns multiple route alternatives scored by Net Realization.
    """
    try:
        # 1. Fetch alternatives (Mocked for now as we lack Mapbox/Google Key)
        routes = mock_route_alternatives(req.start_loc, req.end_loc)
        
        # 2. Score them
        scored = score_routes(
            market_price=req.market_price,
            yield_qtl=req.yield_qtl,
            routes=routes,
            crop=req.crop,
            storage_type=req.storage_type,
            transport_type=req.transport_type
        )
        
        return {
            "routes": scored,
            "optimal_id": scored[0]["id"] if scored else None
        }
    except Exception as e:
        import traceback
        print(f"Routing Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
