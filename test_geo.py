import httpx
import asyncio
import json

async def test_geocoding(lat, lng):
    headers = {"User-Agent": "MittiMitra-Tester/1.0"}
    for zoom in [10, 12, 14, 16, 18]:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom={zoom}"
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                addr = data.get("address", {})
                area = (
                    addr.get("suburb") or 
                    addr.get("neighbourhood") or 
                    addr.get("city_district") or 
                    addr.get("district") or 
                    addr.get("town") or 
                    addr.get("village") or 
                    addr.get("city")
                )
                print(f"Zoom {zoom}: {area} | Full Addr: {json.dumps(addr)}")
            else:
                print(f"Zoom {zoom}: Failed {res.status_code}")

if __name__ == "__main__":
    # Coordinates provided by user: 19.1500, 72.9389
    asyncio.run(test_geocoding(19.1500, 72.9389))
