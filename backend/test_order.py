import asyncio
import httpx

async def test():
    url = "http://localhost:8000/api/orders"
    payload = {
        "items": [
            {
                "menu_item_id": "test",
                "name": "Test Item",
                "price": 500,
                "quantity": 1,
                "options": {},
                "notes": ""
            }
        ]
    }
    headers = {
        "X-Customer-Ticket": "dummy_ticket"
    }
    
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload, headers=headers)
        print("Status:", r.status_code)
        print("Body:", r.text)

asyncio.run(test())
