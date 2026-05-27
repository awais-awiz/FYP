"""
Menu Routes.

Reads are public (the menu is shown on customer-facing screens). Writes are
admin/manager only. Deletes are soft (preserve referential integrity for
historical orders that reference the item by id).
"""
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models.menu import MenuItemCreate, MenuItemUpdate
from app.routes.auth import require_roles
from app.util import utcnow

router = APIRouter(prefix="/api/menu", tags=["Menu"])

# ─── Public reads ────────────────────────────────────────────────────────

@router.get("")
async def get_menu_items(category: Optional[str] = None, available_only: bool = True):
    """Get all menu items, optionally filtered by category."""
    db = get_database()
    query: dict = {}
    
    if category:
        query["category"] = category
    if available_only:
        query["is_available"] = True
    
    # Exclude items that have been soft-deleted
    query["deleted_at"] = {"$exists": False}

    items = []
    cursor = db.menu_items.find(query).sort("category", 1)
    async for item in cursor:
        item["_id"] = str(item["_id"])
        items.append(item)
    
    return {"items": items, "total": len(items)}


@router.get("/categories")
async def get_categories():
    """Get all unique menu categories."""
    db = get_database()
    categories = await db.menu_items.distinct("category", {"deleted_at": {"$exists": False}})
    return {"categories": categories}


@router.get("/{item_id}")
async def get_menu_item(item_id: str):
    """Get a single menu item by ID."""
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    item = await db.menu_items.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    
    item["_id"] = str(item["_id"])
    return item


# ─── Admin/Manager writes ────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_menu_item(
    item: MenuItemCreate,
    actor: dict = Depends(require_roles("admin", "manager")),
):
    """Create a new menu item. Requires admin or manager role."""
    db = get_database()
    now = utcnow()
    item_dict = item.model_dump()
    
    item_dict["created_at"] = now
    item_dict["updated_at"] = now
    item_dict["created_by"] = actor["username"]

    result = await db.menu_items.insert_one(item_dict)
    item_dict["_id"] = str(result.inserted_id)
    return item_dict


@router.put("/{item_id}")
async def update_menu_item(
    item_id: str,
    item: MenuItemUpdate,
    actor: dict = Depends(require_roles("admin", "manager")),
):
    """Update an existing menu item. Requires admin or manager role."""
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    update_data = {k: v for k, v in item.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    update_data["updated_at"] = utcnow()
    update_data["updated_by"] = actor["username"]

    result = await db.menu_items.update_one(
        {"_id": ObjectId(item_id)}, {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    updated = await db.menu_items.find_one({"_id": ObjectId(item_id)})
    updated["_id"] = str(updated["_id"])
    return updated


@router.delete("/{item_id}")
async def delete_menu_item(
    item_id: str,
    actor: dict = Depends(require_roles("admin")),
):
    """
    Soft-delete: marks the item unavailable and stamps a tombstone field.
    Requires admin role.
    """
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    now = utcnow()
    result = await db.menu_items.update_one(
        {"_id": ObjectId(item_id), "deleted_at": {"$exists": False}},
        {"$set": {
            "is_available": False,
            "deleted_at": now,
            "deleted_by": actor["username"],
            "updated_at": now,
        }},
    )
    
    if result.matched_count == 0:
        # Check if it actually exists or was already deleted
        existing = await db.menu_items.find_one({"_id": ObjectId(item_id)})
        if not existing:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Menu item already deleted")

    return {"message": "Menu item deleted successfully (soft delete)"}