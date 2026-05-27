import asyncio
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.util import utcnow

async def main():
    await connect_to_mongo()
    db = get_database()
    payment = await db.payments.find_one({"status": "pending"}, sort=[("created_at", -1)])
    if payment:
        now = utcnow()
        await db.payments.update_one({"_id": payment["_id"]}, {"$set": {"status": "completed", "completed_at": now}})
        await db.orders.update_one({"order_id": payment["order_id"]}, {"$set": {"payment_status": "paid", "updated_at": now}})
    await close_mongo_connection()

asyncio.run(main())
