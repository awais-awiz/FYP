from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from app.config import settings
from app.database import get_database
from app.models.stripe_payment import StripePaymentCreate
from app.routes.auth import require_roles
from app.services.stripe_service import (
    _generate_qr_base64,
    create_payment_intent,
    verify_webhook,
)
from app.util import utcnow

router = APIRouter(prefix="/api/stripe", tags=["Stripe Payments"])

@router.post("/create-payment-intent", status_code=201)
async def create_intent(payment: StripePaymentCreate):
    db = get_database()
    order = await db.orders.find_one({"order_id": payment.order_id})
    if not order and ObjectId.is_valid(payment.order_id):
        order = await db.orders.find_one({"_id": ObjectId(payment.order_id)})
    
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    server_amount = float(order.get("total_price", 0.0))
    
    try:
        result = await create_payment_intent(
            amount_dollars=server_amount,
            currency=payment.currency,
            order_id=order["order_id"],
            table_number=payment.table_number or order.get("table_number"),
            description=payment.description,
        )
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e))

    payment_record = {
        "payment_intent_id": result["payment_intent_id"],
        "order_id": order["order_id"],
        "amount": server_amount,
        "status": "pending",
        "created_at": utcnow(),
    }
    await db.payments.update_one(
        {"order_id": order["order_id"]},
        {"$set": payment_record},
        upsert=True,
    )
    return result

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = verify_webhook(payload, sig_header)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    # ... logic to process event ...
    return {"received": True}