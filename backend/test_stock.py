import asyncio
from app.database import get_database, connect_to_mongo

async def main():
    await connect_to_mongo()
    db = get_database()
    items = await db.menu_items.find({"stock_quantity": {"$lte": 0}}).to_list(None)
    for i in items:
        print(f"Out of stock: {i.get('name')}")

asyncio.run(main())
