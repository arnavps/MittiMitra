import httpx
import asyncio
import json

async def debug_geocode():
    lat, lng = 19.15, 72.9389 # Another spot in Mulund
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=14"
    headers = {"User-Agent": "MittiMitra-Debug/1.0"}
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"ADDRESS: {data.get('address')}")

if __name__ == "__main__":
    asyncio.run(debug_geocode())
