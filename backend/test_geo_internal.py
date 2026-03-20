import asyncio
from main import get_area_name

async def test():
    lat, lng = 19.1726, 72.9425
    print(f"Testing {lat}, {lng}...")
    name = await get_area_name(lat, lng)
    print(f"Result: {name}")

if __name__ == "__main__":
    asyncio.run(test())
