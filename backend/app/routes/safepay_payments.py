from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.database import get_database
from app.models.safepay_payment import SafepayPaymentCreate
from app.services.safepay_service import init_safepay_payment, verify_safepay_webhook
from app.util import utcnow
import json
import uuid

router = APIRouter(prefix="/api/safepay", tags=["Safepay Payments"])

@router.post("/generate-qr", status_code=201)
async def create_safepay_intent(payment: SafepayPaymentCreate):
    db = get_database()
    order = await db.orders.find_one({"order_id": payment.order_id})
    if not order and ObjectId.is_valid(payment.order_id):
        order = await db.orders.find_one({"_id": ObjectId(payment.order_id)})
    
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    server_amount = float(order.get("total_price", 0.0))
    if server_amount <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order has no payable amount")

    try:
        result = await init_safepay_payment(
            amount_pkr=server_amount,
            order_id=order.get("order_id") or str(order["_id"])
        )
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e))

    payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"

    payment_record = {
        "payment_id": payment_id,
        "tracker_id": result["tracker"],
        "order_id": order.get("order_id") or str(order["_id"]),
        "amount": server_amount,
        "status": "pending",
        "method": "safepay",
        "checkout_url": result["checkout_url"],
        "created_at": utcnow(),
    }
    
    await db.payments.update_one(
        {"order_id": payment_record["order_id"]},
        {"$set": payment_record},
        upsert=True,
    )
    
    return result

@router.post("/webhook")
async def safepay_webhook(request: Request):
    """
    Safepay will call this endpoint when a transaction succeeds or fails.
    """
    payload = await request.body()
    sig_header = request.headers.get("x-sfpy-signature", "")
    
    try:
        is_valid = verify_safepay_webhook(payload, sig_header)
        if not is_valid:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    data = json.loads(payload)
    print(f"[SafePay Webhook] Received payload: {data}")
    
    # Safepay V2 webhooks nest the payload under a "data" object
    payload_data = data.get("data", data)
    tracker = payload_data.get("tracker")
    state = payload_data.get("state")
    
    if state == "PAID" and tracker:
        db = get_database()
        now = utcnow()


        
        # Find the payment by tracker
        payment = await db.payments.find_one({"tracker_id": tracker})
        if payment:
            # Update Payment status
            await db.payments.update_one(
                {"_id": payment["_id"]},
                {"$set": {
                    "status": "completed",
                    "completed_at": now
                }}
            )
            # Update Order status
            await db.orders.update_one(
                {"order_id": payment["order_id"]},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": now
                }}
            )

    return {"received": True}
