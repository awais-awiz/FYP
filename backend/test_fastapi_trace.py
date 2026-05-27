import asyncio
from app.database import connect_to_mongo, get_database
from app.routes.safepay_payments import generate_safepay_tracker, SafepayPaymentCreate

async def main():
    await connect_to_mongo()
    try:
        payment = SafepayPaymentCreate(order_id="ORD-6A17007A-4FF5", table_number=2)
        res = await generate_safepay_tracker(payment)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
