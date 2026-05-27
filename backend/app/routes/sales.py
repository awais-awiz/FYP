"""
Sales & Reporting Routes — for Admin and Manager Portals.
All read endpoints are gated; revenue numbers are not public.
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.routes.auth import require_roles
from app.util import utcnow

router = APIRouter(prefix="/api/sales", tags=["Sales"])

VALID_PERIODS = {"today", "week", "month"}

# --- Helpers ---

def _period_start(period: str):
    now = utcnow()
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "week":
        return now - timedelta(days=7)
    if period == "month":
        return now - timedelta(days=30)
    raise HTTPException(status.HTTP_400_BAD_REQUEST, f"period must be one of {sorted(VALID_PERIODS)}")

# --- Endpoints ---

@router.get("/summary")
async def sales_summary(
    period: str = "today",
    _: dict = Depends(require_roles("admin", "manager")),
):
    """Get sales summary statistics for a given period."""
    if period not in VALID_PERIODS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid period: {period}")

    db = get_database()
    start = _period_start(period)

    # Aggregate order stats
    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total_price"},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "cancelled": {"$sum": {"$cond": [{"$eq": ["$status", "cancelled"]}, 1, 0]}},
        }},
    ]
    results = await db.orders.aggregate(pipeline).to_list(1)
    stats = results[0] if results else {
        "total_orders": 0, "total_revenue": 0.0, "completed": 0, "cancelled": 0,
    }

    total_orders = stats.get("total_orders", 0) or 0
    total_revenue = round(stats.get("total_revenue", 0.0) or 0.0, 2)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0.0

    # Average rating
    rating_pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}},
    ]
    rating_result = await db.feedback.aggregate(rating_pipeline).to_list(1)
    avg_rating = round(rating_result[0]["avg"], 2) if rating_result and rating_result[0].get("avg") else 0.0

    # Top category
    cat_pipeline = [
        {"$match": {"created_at": {"$gte": start}, "status": "completed"}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.category", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    cat_result = await db.orders.aggregate(cat_pipeline).to_list(1)
    top_category = cat_result[0]["_id"] if cat_result else None

    return {
        "period": period,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order_value": avg_order_value,
        "completed_orders": stats.get("completed", 0) or 0,
        "cancelled_orders": stats.get("cancelled", 0) or 0,
        "average_rating": avg_rating,
        "top_category": top_category,
    }

@router.get("/top-items")
async def top_items(
    period: str = "month",
    limit: int = Query(10, ge=1, le=100),
    _: dict = Depends(require_roles("admin", "manager")),
):
    """Get the top-selling menu items by quantity sold."""
    if period not in VALID_PERIODS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid period: {period}")

    db = get_database()
    start = _period_start(period)

    pipeline = [
        {"$match": {"created_at": {"$gte": start}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.name",
            "total_sold": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "menu_items",
            "localField": "_id",
            "foreignField": "name",
            "as": "menu_item",
        }},
        {"$project": {
            "_id": 0,
            "name": "$_id",
            "category": {"$ifNull": [{"$arrayElemAt": ["$menu_item.category", 0]}, "Unknown"]},
            "total_sold": 1,
            "total_revenue": {"$round": ["$total_revenue", 2]},
        }},
    ]

    items = await db.orders.aggregate(pipeline).to_list(limit)
    return {"items": items, "total": len(items), "period": period}

@router.get("/revenue-chart")
async def revenue_chart(
    days: int = Query(30, ge=1, le=365),
    _: dict = Depends(require_roles("admin", "manager")),
):
    """Daily revenue for the last N days. Missing days are zero-filled."""
    db = get_database()
    start = utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "revenue": {"$sum": "$total_price"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    raw_data = await db.orders.aggregate(pipeline).to_list(days)
    data_map = {d["_id"]: d for d in raw_data}

    chart_data = []
    total_rev_sum = 0.0
    total_ord_sum = 0

    for i in range(days):
        date_str = (start + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        if date_str in data_map:
            rev = round(data_map[date_str]["revenue"], 2)
            ords = data_map[date_str]["orders"]
        else:
            rev = 0.0
            ords = 0
        chart_data.append({"date": date_str, "revenue": rev, "orders": ords})
        total_rev_sum += rev
        total_ord_sum += ords

    return {
        "data": chart_data,
        "total_revenue": round(total_rev_sum, 2),
        "total_orders": total_ord_sum,
        "days": days,
    }