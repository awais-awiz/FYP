import asyncio
from app.database import get_database, connect_to_mongo

async def main():
    await connect_to_mongo()
    db = get_database()
    items = await db.menu_items.find().to_list(None)
    for i in items:
        if i.get("price", 0) < 100:
            print(f"Low price item: {i.get('name')} - {i.get('price')} PKR")

asyncio.run(main())
