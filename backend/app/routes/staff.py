"""
Staff Management Routes - Admin and Manager only.
Handles the lifecycle of staff accounts and pending signups.
"""
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext

from app.database import get_database
from app.models.user import UserCreate, UserUpdate
from app.routes.auth import VALID_ROLES, require_roles
from app.util import utcnow

router = APIRouter(prefix="/api/staff", tags=["Staff Management"])
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ─── Helpers ──────────────────────────────────────────────────────────────

def _safe_user(user: dict) -> dict:
    """Strip sensitive fields before returning a user document."""
    if not user:
        return user
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    user.pop("password_changed_at", None)
    return user

# ─── Staff CRUD ───────────────────────────────────────────────────────────

@router.get("")
async def list_staff(
    role: Optional[str] = None,
    active_only: bool = False,
    _: dict = Depends(require_roles("admin", "manager")),
):
    """List all staff members. Optionally filter by role or active status."""
    db = get_database()
    query = {}
    if role:
        if role not in VALID_ROLES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid role. Valid: {sorted(VALID_ROLES)}")
        query["role"] = role
    if active_only:
        query["is_active"] = True

    staff = []
    cursor = db.users.find(query).sort("role", 1)
    async for user in cursor:
        staff.append(_safe_user(user))
    return {"staff": staff, "total": len(staff)}

@router.post("", status_code=201)
async def create_staff(
    user: UserCreate,
    _: dict = Depends(require_roles("admin")),
):
    """Create a new staff member (Admin only)."""
    if user.role not in VALID_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid role. Must be: {sorted(VALID_ROLES)}")

    db = get_database()
    if await db.users.find_one({"username": user.username}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")

    now = utcnow()
    user_dict = {
        "username": user.username,
        "password_hash": pwd_context.hash(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "email": user.email,
        "phone": user.phone,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    user_dict.pop("password_hash", None)
    return user_dict

# ─── Approvals ────────────────────────────────────────────────────────────

@router.get("/approvals/pending")
async def get_pending_approvals(
    _: dict = Depends(require_roles("admin", "manager")),
):
    """List all staff signup requests awaiting review."""
    db = get_database()
    approvals = []
    cursor = db.approvals.find({"status": "pending"}).sort("created_at", -1)
    async for approval in cursor:
        approval["_id"] = str(approval["_id"])
        approval.pop("password_hash", None)
        approvals.append(approval)
    return {"approvals": approvals, "total": len(approvals)}

@router.post("/approvals/{approval_id}/approve")
async def approve_request(
    approval_id: str,
    actor: dict = Depends(require_roles("admin", "manager")),
):
    """Approve a signup and materialize the user in the database."""
    db = get_database()
    if not ObjectId.is_valid(approval_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid approval ID")

    now = utcnow()
    result = await db.approvals.update_one(
        {"_id": ObjectId(approval_id), "status": "pending"},
        {"$set": {"status": "approved", "reviewed_at": now, "reviewed_by": actor["username"]}},
    )
    
    if result.modified_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Approval request not found or already reviewed")

    approval = await db.approvals.find_one({"_id": ObjectId(approval_id)})

    if approval.get("kind") == "signup" and approval.get("password_hash"):
        if await db.users.find_one({"username": approval["username"]}):
             raise HTTPException(status.HTTP_409_CONFLICT, "User already exists")
        
        await db.users.insert_one({
            "username": approval["username"],
            "password_hash": approval["password_hash"],
            "full_name": approval.get("full_name", approval["username"]),
            "role": approval["role"],
            "email": approval.get("email"),
            "phone": approval.get("phone"),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        })

    approval["_id"] = str(approval["_id"])
    approval.pop("password_hash", None)
    return approval

@router.post("/approvals/{approval_id}/reject")
async def reject_request(
    approval_id: str,
    reason: str = "",
    actor: dict = Depends(require_roles("admin", "manager")),
):
    """Reject a pending staff request."""
    db = get_database()
    if not ObjectId.is_valid(approval_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid approval ID")

    result = await db.approvals.update_one(
        {"_id": ObjectId(approval_id), "status": "pending"},
        {"$set": {"status": "rejected", "reason": reason[:500], "reviewed_at": utcnow(), "reviewed_by": actor["username"]}},
    )
    if result.modified_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Approval request not found or already reviewed")

    updated = await db.approvals.find_one({"_id": ObjectId(approval_id)})
    updated["_id"] = str(updated["_id"])
    return updated

# ─── Per-user routes ──────────────────────────────────────────────────────

@router.get("/{username}")
async def get_staff_by_username(
    username: str,
    _: dict = Depends(require_roles("admin", "manager")),
):
    db = get_database()
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")
    return _safe_user(user)

@router.put("/{username}")
async def update_staff(
    username: str,
    update: UserUpdate,
    actor: dict = Depends(require_roles("admin")),
):
    db = get_database()
    if update.role and update.role not in VALID_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid role. Valid: {sorted(VALID_ROLES)}")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    # Safety checks for current admin
    if actor["username"] == username:
        if update_data.get("role") and update_data["role"] != "admin":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admins cannot demote themselves")
        if update_data.get("is_active") is False:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admins cannot deactivate themselves")

    update_data["updated_at"] = utcnow()
    result = await db.users.update_one({"username": username}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    updated = await db.users.find_one({"username": username})
    return _safe_user(updated)

@router.delete("/{username}")
async def delete_staff(
    username: str,
    actor: dict = Depends(require_roles("admin")),
):
    if actor["username"] == username:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admins cannot delete themselves")

    db = get_database()
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    if user.get("role") == "admin":
        admin_count = await db.users.count_documents({"role": "admin", "is_active": True})
        if admin_count <= 1:
            raise HTTPException(status.HTTP_409_CONFLICT, "Cannot delete the last active admin")

    await db.users.delete_one({"username": username})
    return {"message": f"Staff member '{username}' deleted successfully"}