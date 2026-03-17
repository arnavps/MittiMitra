import asyncio
import sys

# Add backend to path if needed, though running inside backend works.
from main import get_harvest_recommendation, HarvestRequest

async def test():
    req = HarvestRequest(
        crop="tomatoes",
        location={"lat": 18.5204, "lng": 73.8567},
        yield_est_quintals=50,
        language="en",
        is_harvested=True,
        storage_type="Open Field",
        transport_type="Open Trolley"
    )
    try:
        res = await get_harvest_recommendation(req)
        print("SUCCESS")
    except Exception as e:
        print("FAILED WITH EXCEPTION")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
