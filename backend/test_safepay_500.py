import asyncio
import httpx

async def main():
    url = "http://localhost:8000/api/safepay/create-tracker"
    payload = {
        "order_id": "ORD-6A17007A-4FF5",
        "table_number": 2
    }
    
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")

asyncio.run(main())
