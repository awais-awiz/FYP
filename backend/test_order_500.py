import asyncio
import httpx

async def main():
    url = "http://localhost:8000/api/orders"
    payload = {
        "table_number": 3,
        "items": [
            {
                "menu_item_id": "dummy_id",
                "name": "Pina Colada",
                "price": 700.0,
                "quantity": 1,
                "special_instructions": ""
            }
        ]
    }
    
    # We need a valid session/ticket.
    # We can fake the request and see if it hits 500 before the ticket check,
    # or we can check the DB for a real session.
    from app.database import get_database, connect_to_mongo
    await connect_to_mongo()
    db = get_database()
    session = await db.table_sessions.find_one({"is_active": True})
    if not session:
        print("No active session found")
        return
        
    import jwt
    from app.config import settings
    
    ticket = jwt.encode({
        "session_id": session["session_id"],
        "table_number": session["table_number"],
        "type": "customer"
    }, settings.SECRET_KEY, algorithm="HS256")
    
    payload["table_number"] = session["table_number"]
    
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload, headers={"X-Customer-Ticket": ticket})
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")

asyncio.run(main())
