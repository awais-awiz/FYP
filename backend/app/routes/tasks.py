"""
Task Management Routes.

Hardening:
  • RBAC on every endpoint.
  • Status transitions follow an explicit state machine + CAS.
  • Only the assignee or a manager+ may transition a task.
  • Persisted timestamps go through app.util.utcnow() (timezone-aware).
"""
import uuid
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models.task import TaskCreate, TaskStatus, TaskStatusUpdate
from app.routes.auth import VALID_ROLES, require_roles
from app.util import utcnow

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

# State machine: pending → in_progress → completed | cancelled
TASK_TRANSITIONS: dict[str, set[str]] = {
    TaskStatus.PENDING.value:     {TaskStatus.IN_PROGRESS.value, TaskStatus.CANCELLED.value},
    TaskStatus.IN_PROGRESS.value: {TaskStatus.COMPLETED.value,   TaskStatus.CANCELLED.value},
    TaskStatus.COMPLETED.value:   set(),
    TaskStatus.CANCELLED.value:   set(),
}

ASSIGNABLE_ROLES = {"server", "cleaner", "kitchen", "manager", "admin"}

def _generate_task_id() -> str:
    return f"TSK-{uuid.uuid4().hex[:8].upper()}"

def _serialize(task: dict) -> dict:
    task["_id"] = str(task["_id"])
    for field in ("created_at", "updated_at"):
        if isinstance(task.get(field), datetime):
            task[field] = task[field].isoformat()
    return task

# ─── Reads (any staff role) ──────────────────────────────────────────────

@router.get("")
async def list_tasks(
    role: str | None = None,
    status_filter: str | None = None,
    assigned_to: str | None = None,
    table_number: int | None = None,
    actor: dict = Depends(require_roles(*ASSIGNABLE_ROLES)),
):
    """List tasks (filterable). Non-managers only see their own tasks."""
    db = get_database()
    query: dict = {}

    if role:
        if role not in VALID_ROLES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                f"Invalid role. Valid: {sorted(VALID_ROLES)}")
        query["role"] = role
    if status_filter:
        if status_filter not in {s.value for s in TaskStatus}:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status filter")
        query["status"] = status_filter
    if assigned_to:
        query["assigned_to"] = assigned_to
    if table_number is not None:
        query["table_number"] = table_number

    # Scope: a non-manager can only see their own tasks regardless of filters.
    if actor["role"] not in {"manager", "admin"}:
        query["assigned_to"] = actor["username"]

    tasks = []
    cursor = db.tasks.find(query).sort("created_at", -1)
    async for task in cursor:
        tasks.append(_serialize(task))
    return {"tasks": tasks, "total": len(tasks)}

# ─── Creation (manager/admin) ────────────────────────────────────────────

@router.post("", status_code=201)
async def create_task(
    task: TaskCreate,
    actor: dict = Depends(require_roles("manager", "admin")),
):
    if task.role not in VALID_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Invalid task.role. Valid: {sorted(VALID_ROLES)}")

    db = get_database()
    assignee = await db.users.find_one({"username": task.assigned_to, "is_active": True})
    if not assignee:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Assignee '{task.assigned_to}' not found or inactive")
    if assignee["role"] != task.role:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Assignee '{task.assigned_to}' has role '{assignee['role']}' "
            f"but task targets role '{task.role}'",
        )

    now = utcnow()
    task_dict = {
        "task_id": _generate_task_id(),
        "title": task.title,
        "description": task.description,
        "assigned_to": task.assigned_to,
        "role": task.role,
        "priority": task.priority.value,
        "status": TaskStatus.PENDING.value,
        "table_number": task.table_number,
        "due_time": task.due_time,
        "notes": None,
        "created_at": now,
        "updated_at": now,
        "created_by": actor["username"],
    }

    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = str(result.inserted_id)
    return _serialize(task_dict)

# ─── Per-task ────────────────────────────────────────────────────────────

@router.get("/{task_id}")
async def get_task(
    task_id: str,
    actor: dict = Depends(require_roles(*ASSIGNABLE_ROLES)),
):
    db = get_database()
    task = await db.tasks.find_one({"task_id": task_id})
    if not task and ObjectId.is_valid(task_id):
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    if actor["role"] not in {"manager", "admin"} and task.get("assigned_to") != actor["username"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "You can only view tasks assigned to you")
    return _serialize(task)

@router.patch("/{task_id}/status")
async def update_task_status(
    task_id: str,
    update: TaskStatusUpdate,
    actor: dict = Depends(require_roles(*ASSIGNABLE_ROLES)),
):
    """Transition a task status."""
    db = get_database()
    task = await db.tasks.find_one({"task_id": task_id})
    if not task and ObjectId.is_valid(task_id):
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    if actor["role"] not in {"manager", "admin"} and task.get("assigned_to") != actor["username"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Only the assignee or a manager+ may update this task")

    current = task["status"]
    new_status = update.status.value

    if new_status == current:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Task is already in that status")

    allowed = TASK_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid transition '{current}' → '{new_status}'. Allowed: {sorted(allowed)}",
        )

    now = utcnow()
    set_fields = {
        "status": new_status,
        "updated_at": now,
        "status_updated_by": actor["username"],
    }
    if update.notes is not None:
        set_fields["notes"] = update.notes[:500]

    result = await db.tasks.update_one(
        {"_id": task["_id"], "status": current},
        {"$set": set_fields},
    )
    if result.modified_count == 0:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "Task changed concurrently; refresh and retry")

    updated = await db.tasks.find_one({"_id": task["_id"]})
    return _serialize(updated)

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    _: dict = Depends(require_roles("manager", "admin")),
):
    db = get_database()
    result = await db.tasks.delete_one({"task_id": task_id})
    if result.deleted_count == 0 and ObjectId.is_valid(task_id):
        result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return {"message": f"Task '{task_id}' deleted successfully"}