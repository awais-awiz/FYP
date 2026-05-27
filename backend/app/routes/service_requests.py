"""Service request routes — customers ring for waiter, cleaner, bill, etc."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database import get_database

router = APIRouter(prefix="/api/service-requests", tags=["service-requests"])


class ServiceRequestCreate(BaseModel):
    table_number: str
    request_type: str   # "waiter" | "cleaner" | "bill" | "napkins" | "emergency"
    note: Optional[str] = None


@router.post("", status_code=201)
async def create_service_request(payload: ServiceRequestCreate):
    db = get_database()
    doc = {
        "table_number": payload.table_number,
        "request_type": payload.request_type,
        "note": payload.note,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "resolved_at": None,
    }
    result = await db.service_requests.insert_one(doc)
    return {"id": str(result.inserted_id), "status": "pending"}


@router.get("")
async def list_service_requests(status: Optional[str] = None):
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    cursor = db.service_requests.find(query).sort("created_at", -1).limit(50)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["created_at"] = doc["created_at"].isoformat() if doc.get("created_at") else None
        doc["resolved_at"] = doc["resolved_at"].isoformat() if doc.get("resolved_at") else None
        items.append(doc)
    return {"requests": items}


@router.patch("/{request_id}/resolve")
async def resolve_service_request(request_id: str):
    from bson import ObjectId
    db = get_database()
    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}},
    )
    return {"status": "resolved"}
