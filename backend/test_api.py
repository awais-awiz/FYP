import asyncio
import httpx
from bson import ObjectId

async def test_api():
    # First create a mock order to test against
    from app.database import get_database, connect_to_mongo
    await connect_to_mongo()
    db = get_database()
    order = await db.orders.insert_one({
        "order_id": "test_safepay_order",
        "total_price": 500.0,
        "payment_status": "pending"
    })
    
    url = "http://localhost:8000/api/safepay/create-tracker"
    payload = {
        "order_id": "test_safepay_order",
        "table_number": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        print("Status:", response.status_code)
        print("Response:", response.text)

asyncio.run(test_api())
