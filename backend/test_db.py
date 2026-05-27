import asyncio
from app.database import get_database, connect_to_mongo

async def main():
    await connect_to_mongo()
    db = get_database()
    # get last 3 orders
    orders = await db.orders.find().sort("created_at", -1).limit(3).to_list(None)
    for o in orders:
        print(f"Order: {o.get('order_id')} - Status: {o.get('status')} - Payment: {o.get('payment_status')}")
    
    # get last 3 payments
    payments = await db.payments.find().sort("created_at", -1).limit(3).to_list(None)
    for p in payments:
        print(f"Payment: {p.get('order_id')} - Method: {p.get('payment_method')} - Status: {p.get('status')}")

asyncio.run(main())
