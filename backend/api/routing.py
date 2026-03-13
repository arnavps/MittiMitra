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
    disease_severity: float = 0.0 # Phase 9

@router.post("")
async def get_optimal_route(req: RoutingRequest):
    """
    Returns multiple route alternatives scored by Net Realization.
    """
    try:
        # 1. Fetch alternatives (Mocked for now as we lack Mapbox/Google Key)
        routes = mock_route_alternatives(req.start_loc, req.end_loc)
        
        # Phase 9: Logistics Rerouting Trigger
        # If Pathological Risk is high (>0.3), disable distant Mandis (>100km)
        if req.disease_severity > 0.3:
            filtered_routes = [r for r in routes if r.get("distance_km", 0) <= 100]
            # Fallback if all are distant (should not happen in mock, but for safety)
            if filtered_routes:
                routes = filtered_routes
        
        # 2. Score them
        scored = score_routes(
            market_price=req.market_price,
            yield_qtl=req.yield_qtl,
            routes=routes,
            crop=req.crop,
            storage_type=req.storage_type,
            transport_type=req.transport_type,
            # Pass disease_severity for more accurate transit spoilage in scoring
            disease_multiplier=2.5 if req.disease_severity > 0.3 else 1.0
        )
        
        return {
            "routes": scored,
            "optimal_id": scored[0]["id"] if scored else None,
            "pathology_applied": req.disease_severity > 0.3
        }
    except Exception as e:
        import traceback
        print(f"Routing Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
