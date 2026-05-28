"""
Unified Payment Routes.
Handles QR code generation and CAS-protected confirmation.
RBAC: Confirmation requires staff/manager/admin roles.
"""
import json
import uuid
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models.payment import PaymentConfirm, PaymentCreate, PaymentStatusEnum
from app.routes.auth import require_roles
from app.util import utcnow

# Using a slightly different prefix or tag if necessary to distinguish from Stripe
router = APIRouter(prefix="/api/payments-manual", tags=["Manual Payments"])

# ─── Internal Helpers ──────────────────────────────────────────────────────

def _stringify_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/generate-qr", status_code=201)
async def generate_qr_payment(payment: PaymentCreate):
    """
    Generate QR data for a pending payment. 
    The amount is taken from the database order, NOT the request body,
    to prevent clients from tampering with the price.
    """
    db = get_database()

    # Find the order by order_id or MongoDB _id
    order = await db.orders.find_one({"order_id": payment.order_id})
    if not order and ObjectId.is_valid(payment.order_id):
        order = await db.orders.find_one({"_id": ObjectId(payment.order_id)})
    
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    if order.get("payment_status") == "paid":
        raise HTTPException(status.HTTP_409_CONFLICT, "Order is already paid")

    # Use server-side truth for the amount
    server_amount = float(order.get("total_price", 0.0))
    if server_amount <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order has no payable amount")

    payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
    
    # Payload for the QR code scanner
    qr_data = json.dumps({
        "payment_id": payment_id,
        "order_id": order.get("order_id") or str(order["_id"]),
        "amount": server_amount,
        "method": payment.method.value,
        "restaurant": "S.A.F.E. Table",
    })

    payment_dict = {
        "payment_id": payment_id,
        "order_id": order.get("order_id") or str(order["_id"]),
        "amount": server_amount,
        "method": payment.method.value,
        "status": PaymentStatusEnum.PENDING.value,
        "qr_code_data": qr_data,
        "created_at": utcnow(),
        "completed_at": None,
    }

    result = await db.payments.insert_one(payment_dict)
    payment_dict["_id"] = str(result.inserted_id)
    return payment_dict


@router.post("/confirm")
async def confirm_payment(
    confirm: PaymentConfirm,
    actor: dict = Depends(require_roles("server", "manager", "admin")),
):
    """
    Confirm a payment (Cash/Manual). 
    Uses Compare-and-Swap (CAS) to ensure a payment isn't confirmed twice.
    """
    db = get_database()
    now = utcnow()

    # CAS Update: Only transition from PENDING to COMPLETED
    result = await db.payments.update_one(
        {"payment_id": confirm.payment_id, "status": PaymentStatusEnum.PENDING.value},
        {"$set": {
            "status": PaymentStatusEnum.COMPLETED.value,
            "completed_at": now,
            "completed_by": actor["username"],
        }},
    )

    if result.modified_count == 0:
        existing = await db.payments.find_one({"payment_id": confirm.payment_id})
        if not existing:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment record not found")
        raise HTTPException(
            status.HTTP_409_CONFLICT, 
            f"Payment is already '{existing['status']}'"
        )

    # Update the Order status to 'paid'
    payment = await db.payments.find_one({"payment_id": confirm.payment_id})
    await db.orders.update_one(
        {"order_id": payment["order_id"], "payment_status": {"$ne": "paid"}},
        {"$set": {"payment_status": "paid", "updated_at": now}},
    )

    return _stringify_id(payment)


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    _: dict = Depends(require_roles("server", "manager", "admin", "kitchen")),
):
    db = get_database()
    payment = await db.payments.find_one({"payment_id": payment_id})
    if not payment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")
    return _stringify_id(payment)


@router.get("/order/{order_id}")
async def get_payment_by_order(
    order_id: str,
):
    db = get_database()
    payment = await db.payments.find_one({"order_id": order_id})
    if not payment and ObjectId.is_valid(order_id):
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if order:
            resolved_id = order.get("order_id") or str(order["_id"])
            payment = await db.payments.find_one({"order_id": resolved_id})

    if not payment:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No payment found for this order. Create one via /api/payments-manual/generate-qr first.",
        )

    # ── Fallback: If still pending AND has a SafePay tracker, check SafePay directly ──
    if payment.get("status") == "pending" and payment.get("tracker_id"):
        try:
            from app.services.safepay_service import check_safepay_tracker_status
            safepay_status = await check_safepay_tracker_status(payment["tracker_id"])
            if safepay_status and safepay_status.get("state") == "PAID":
                now = utcnow()
                await db.payments.update_one(
                    {"_id": payment["_id"]},
                    {"$set": {"status": "completed", "completed_at": now}}
                )
                await db.orders.update_one(
                    {"order_id": payment["order_id"]},
                    {"$set": {"payment_status": "paid", "updated_at": now}}
                )
                payment["status"] = "completed"
                payment["completed_at"] = now
                print(f"[Fallback] Payment {payment['payment_id']} marked completed via SafePay API check")
        except Exception as e:
            print(f"[Fallback] SafePay check failed (non-fatal): {e}")

    return _stringify_id(payment)
