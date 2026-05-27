"""
Admin dashboard / reporting routes.
Unified Version - Auth logic moved to /api/auth.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.models.admin import DashboardStats
from app.routes.auth import require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

# Only admins and managers can view the dashboard
admin_manager_only = require_roles("admin", "manager")

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(_: dict = Depends(admin_manager_only)):
    """Fetch real-time business statistics for the dashboard."""
    db = get_database()
    today_start = _utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Count orders
    total_orders_today = await db.orders.count_documents(
        {"created_at": {"$gte": today_start}}
    )
    active_orders = await db.orders.count_documents(
        {"status": {"$nin": ["completed", "cancelled"]}}
    )
    completed_today = await db.orders.count_documents(
        {"status": "completed", "updated_at": {"$gte": today_start}}
    )

    # Revenue pipeline
    pipeline = [
        {"$match": {"created_at": {"$gte": today_start}, "payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}},
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = round(revenue_result[0]["total"], 2) if revenue_result else 0.0

    total_menu_items = await db.menu_items.count_documents({})

    # Average rating
    rating_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$rating"}}}]
    rating_result = await db.feedback.aggregate(rating_pipeline).to_list(1)
    avg_rating = round(rating_result[0]["avg"], 2) if rating_result and rating_result[0].get("avg") else 0.0

    active_tables = await db.table_sessions.count_documents({"is_active": True})

    return DashboardStats(
        total_orders_today=total_orders_today,
        active_orders=active_orders,
        completed_orders_today=completed_today,
        total_revenue_today=total_revenue,
        total_menu_items=total_menu_items,
        average_rating=avg_rating,
        active_tables=active_tables,
    )

@router.get("/orders/history")
async def get_order_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    _: dict = Depends(admin_manager_only),
):
    """Fetch historical orders with pagination and filtering."""
    db = get_database()
    valid_statuses = {"pending", "confirmed", "preparing", "ready", "completed", "cancelled"}
    
    query: dict = {}
    if status_filter:
        if status_filter not in valid_statuses:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid status. Valid: {sorted(valid_statuses)}"
            )
        query["status"] = status_filter

    orders = []
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    async for order in cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)

    total = await db.orders.count_documents(query)
    return {
        "orders": orders, 
        "total": total, 
        "skip": skip, 
        "limit": limit
    }