import asyncio
from app.database import connect_to_mongo, get_database

async def main():
    await connect_to_mongo()
    db = get_database()
    indexes = await db.payments.index_information()
    for name, info in indexes.items():
        print(f"Index: {name}, Keys: {info['key']}, Unique: {info.get('unique')}")

asyncio.run(main())
