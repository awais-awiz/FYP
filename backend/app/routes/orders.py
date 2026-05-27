"""
Order routes — RBAC + customer-ticket-bound + CAS state machine + atomic stock.

Customer flow (POST / and reads):
  • Requires X-Customer-Ticket. The ticket's table_number is authoritative.
  • Stock is reserved at creation via atomic decrements. 
  • On failure, partial reservations are rolled back.

Staff flow (PATCH /status, kitchen views):
  • RBAC via require_roles. 
  • Status transitions use compare-and-swap (CAS) to prevent race conditions.
  • Cancellation refunds inventory exactly once for refundable statuses.
"""
from datetime import timedelta
from typing import Optional, List, Dict, Set
from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.database import get_database
from app.models.order import OrderCreate, OrderStatus, OrderStatusUpdate, PaymentStatus
from app.routes.auth import (
    decode_token,
    require_customer_ticket,
    require_roles,
    verify_customer_ticket,
)
from app.util import utcnow
from app.websockets.kitchen import manager

router = APIRouter(prefix="/api/orders", tags=["Orders"])

VALID_TRANSITIONS: Dict[str, Set[str]] = {
    OrderStatus.PENDING.value:    {OrderStatus.CONFIRMED.value, OrderStatus.CANCELLED.value},
    OrderStatus.CONFIRMED.value:  {OrderStatus.PREPARING.value, OrderStatus.CANCELLED.value},
    OrderStatus.PREPARING.value:  {OrderStatus.READY.value,     OrderStatus.CANCELLED.value},
    OrderStatus.READY.value:      {OrderStatus.COMPLETED.value},
    OrderStatus.COMPLETED.value:  set(),
    OrderStatus.CANCELLED.value:  set(),
}

# Only refund stock for cancellations before the kitchen commits ingredients
REFUNDABLE_FROM = {
    OrderStatus.PENDING.value,
    OrderStatus.CONFIRMED.value,
    OrderStatus.PREPARING.value,
}

# ─── Internal Helpers ──────────────────────────────────────────────────────

def _generate_order_id() -> str:
    import uuid
    ts = hex(int(utcnow().timestamp()))[2:].upper()
    return f"ORD-{ts}-{uuid.uuid4().hex[:4].upper()}"

def _stringify_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def _serialize_dt(value) -> str:
    return value.isoformat() if hasattr(value, "isoformat") else str(value)

async def _reserve_stock(db, item_id: ObjectId, quantity: int) -> Optional[dict]:
    """Atomically reserve quantity of an item."""
    return await db.menu_items.find_one_and_update(
        {
            "_id": item_id,
            "stock_quantity": {"$gte": quantity},
            "is_available": True,
            "deleted_at": {"$exists": False}
        },
        {"$inc": {"stock_quantity": -quantity}},
    )

async def _release_stock(db, item_id: ObjectId, quantity: int) -> None:
    """Put inventory back (rollback or refund)."""
    await db.menu_items.update_one(
        {"_id": item_id},
        {"$inc": {"stock_quantity": int(quantity)}},
    )

async def _refund_order_stock(db, order: dict) -> None:
    """Refund line items for a cancelled order."""
    for item in order.get("items", []):
        mid = item.get("menu_item_id")
        qty = item.get("quantity", 0)
        if mid and qty > 0 and ObjectId.is_valid(mid):
            await _release_stock(db, ObjectId(mid), qty)

def _authorize_for_table(table_number: int, auth: str | None, ticket: str | None):
    """Auth gate for order reads: Staff JWT OR Ticket for specific table."""
    if auth and auth.lower().startswith("bearer "):
        try:
            decode_token(auth.split(" ", 1)[1])
            return
        except Exception: pass
    if ticket:
        try:
            payload = verify_customer_ticket(ticket)
            if int(payload.get("table_number", -1)) == int(table_number):
                return
        except Exception: pass
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Staff token or valid table ticket required")

# ─── Customer Endpoints ───────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_order(
    order: OrderCreate,
    ticket: dict = Depends(require_customer_ticket),
):
    db = get_database()
    
    # Verify session is still active
    session = await db.table_sessions.find_one({
        "session_id": ticket["session_id"],
        "is_active": True,
    })
    if not session:
        raise HTTPException(status.HTTP_410_GONE, "Session no longer active")

    if not order.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order must contain items")

    # Resolve items by name to ensure server-side truth
    names = [item.name for item in order.items]
    menu_items = await db.menu_items.find({"name": {"$in": names}}).to_list(length=100)
    menu_lookup = {m["name"]: m for m in menu_items}

    max_prep = 20
    reserved = []
    
    try:
        for item in order.items:
            m = menu_lookup.get(item.name)
            if not m or not m.get("is_available", True):
                raise HTTPException(status.HTTP_409_CONFLICT, f"'{item.name}' unavailable")
            
            # Stock check and reservation
            ok = await _reserve_stock(db, m["_id"], item.quantity)
            if not ok:
                raise HTTPException(status.HTTP_409_CONFLICT, f"Insufficient stock: {item.name}")
            
            reserved.append({
                "menu_item_id": str(m["_id"]),
                "name": m["name"],
                "price": float(m["price"]),
                "quantity": int(item.quantity),
                "special_instructions": item.special_instructions
            })
            max_prep = max(max_prep, int(m.get("prep_time_minutes", 15)))

        now = utcnow()
        total_price = round(sum(i["price"] * i["quantity"] for i in reserved), 2)
        
        order_dict = {
            "order_id": _generate_order_id(),
            "table_number": ticket["table_number"],
            "session_id": ticket["session_id"],
            "items": reserved,
            "total_price": total_price,
            "status": OrderStatus.PENDING.value,
            "payment_status": PaymentStatus.UNPAID.value,
            "created_at": now,
            "updated_at": now,
            "estimated_ready_time": now + timedelta(minutes=max_prep),
            "order_source": "menu",
        }

        result = await db.orders.insert_one(order_dict)
        order_dict["_id"] = str(result.inserted_id)

        # Notify Kitchen
        await manager.broadcast_new_order({
            "order_id": order_dict["order_id"],
            "table_number": order_dict["table_number"],
            "items": order_dict["items"],
            "status": order_dict["status"],
            "created_at": _serialize_dt(now)
        })
        return order_dict

    except Exception as e:
        # Rollback any stock reserved during this failed request
        for r in reserved:
            await _release_stock(db, ObjectId(r["menu_item_id"]), r["quantity"])
        raise e

# ─── Read & Status Endpoints ──────────────────────────────────────────────

@router.get("/table/{table_number}")
async def get_table_orders(
    table_number: int,
    auth: Optional[str] = Header(None, alias="Authorization"),
    ticket: Optional[str] = Header(None, alias="X-Customer-Ticket"),
):
    _authorize_for_table(table_number, auth, ticket)
    db = get_database()
    cursor = db.orders.find({"table_number": table_number}).sort("created_at", -1)
    orders = await cursor.to_list(length=100)
    return {"orders": [_stringify_id(o) for o in orders]}

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    actor: dict = Depends(require_roles("server", "kitchen", "manager", "admin")),
):
    db = get_database()
    order = await db.orders.find_one({"$or": [{"order_id": order_id}, {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}]})
    if not order:
        raise HTTPException(404, "Order not found")

    current = order["status"]
    new_status = body.status.value
    if new_status == current: return _stringify_id(order)

    if new_status not in VALID_TRANSITIONS.get(current, set()):
        raise HTTPException(400, f"Invalid transition {current} -> {new_status}")

    # CAS Update
    result = await db.orders.update_one(
        {"_id": order["_id"], "status": current},
        {"$set": {"status": new_status, "updated_at": utcnow(), "status_updated_by": actor["username"]}}
    )
    if result.modified_count == 0:
        raise HTTPException(409, "Status was updated by another user. Refresh.")

    if new_status == OrderStatus.CANCELLED.value and current in REFUNDABLE_FROM:
        await _refund_order_stock(db, order)

    updated = await db.orders.find_one({"_id": order["_id"]})
    await manager.broadcast_order_update({
        "order_id": updated["order_id"],
        "status": updated["status"],
        "updated_at": _serialize_dt(updated["updated_at"])
    })
    return _stringify_id(updated)

@router.get("/kitchen/active", tags=["Kitchen"])
async def get_kitchen_active_orders(_: dict = Depends(require_roles("server", "kitchen", "manager", "admin"))):
    db = get_database()
    active_statuses = [OrderStatus.PENDING.value, OrderStatus.CONFIRMED.value, OrderStatus.PREPARING.value, OrderStatus.READY.value]
    cursor = db.orders.find({"status": {"$in": active_statuses}}).sort("created_at", 1)
    orders = await cursor.to_list(length=100)
    return {"orders": [_stringify_id(o) for o in orders]}