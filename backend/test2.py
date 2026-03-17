import asyncio
import sys
import traceback

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
        with open("trace.txt", "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(test())
