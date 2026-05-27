"""
Table Session Routes — staff-only (with dev-only customer bootstrap).

Sessions are the foundation of customer trust: only floor staff can open or
close one. When a session is opened, a short-lived signed CUSTOMER TICKET
(JWT, audience=customer) is returned alongside the raw session_id. The
customer's device uses the ticket — never the raw session_id — for all
downstream calls (orders, voice, table reads).

The /dev-session endpoint is mounted ONLY when ENV != production so the
customer-side demo can self-bootstrap a ticket without staff intervention.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.config import settings
from app.database import get_database
from app.models.table import TableSessionCreate
from app.routes.auth import (
    create_customer_ticket,
    require_customer_ticket,
    require_roles,
)
from app.util import utcnow

router = APIRouter(prefix="/api/tables", tags=["Tables"])

# ─── Staff endpoints ──────────────────────────────────────────────────────

@router.post("/session", status_code=201)
async def create_session(
    session: TableSessionCreate,
    actor: dict = Depends(require_roles("server", "manager", "admin")),
):
    """Open a new dining session for a table.

    Atomically closes any prior active session for the same table, then opens
    a new one and returns BOTH the session_id (server-internal) and a signed
    customer_ticket (handed to the customer)."""
    db = get_database()
    now = utcnow()

    await db.table_sessions.update_many(
        {"table_number": session.table_number, "is_active": True},
        {"$set": {"is_active": False, "ended_at": now, "ended_by": actor["username"]}},
    )

    session_id = f"SES-{uuid.uuid4().hex[:12].upper()}"
    session_dict = {
        "table_number": session.table_number,
        "session_id": session_id,
        "is_active": True,
        "language": session.language,
        "created_at": now,
        "created_by": actor["username"],
        "ended_at": None,
    }

    result = await db.table_sessions.insert_one(session_dict)
    session_dict["_id"] = str(result.inserted_id)

    customer_ticket = create_customer_ticket(
        table_number=session.table_number,
        session_id=session_id,
    )

    return {
        **session_dict,
        "customer_ticket": customer_ticket,
        "ticket_type": "bearer",
    }


@router.get("/me/session")
async def get_my_session(
    ticket: dict = Depends(require_customer_ticket),
):
    """Customer self-service: confirm the ticket maps to a still-live session."""
    db = get_database()
    sess = await db.table_sessions.find_one({
        "session_id": ticket["session_id"],
        "table_number": ticket["table_number"],
        "is_active": True,
    })
    if not sess:
        raise HTTPException(status.HTTP_410_GONE, "Session is no longer active")
    
    sess["_id"] = str(sess["_id"])
    return {
        "table_number": ticket["table_number"],
        "session_id": ticket["session_id"],
        "language": sess.get("language", "en"),
        "is_active": True,
    }


@router.get("/{table_number}/session")
async def get_active_session(
    table_number: int,
    _: dict = Depends(require_roles("server", "manager", "admin", "kitchen")),
):
    """Look up the active session for a table (staff view)."""
    db = get_database()
    session = await db.table_sessions.find_one(
        {"table_number": table_number, "is_active": True}
    )
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active session for this table")
    
    session["_id"] = str(session["_id"])
    return session


@router.post("/{table_number}/end-session")
async def end_session(
    table_number: int,
    actor: dict = Depends(require_roles("server", "manager", "admin", "cleaner")),
):
    """Close the active session for a table."""
    db = get_database()
    result = await db.table_sessions.update_many(
        {"table_number": table_number, "is_active": True},
        {"$set": {"is_active": False, "ended_at": utcnow(), "ended_by": actor["username"]}},
    )
    if result.modified_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active session to end")
    
    return {
        "message": f"Session ended for table {table_number}",
        "closed_count": result.modified_count
    }


@router.get("/active")
async def get_all_active_tables(
    _: dict = Depends(require_roles("server", "manager", "admin", "kitchen")),
):
    """List all currently-active table sessions (staff view)."""
    db = get_database()
    tables = []
    cursor = db.table_sessions.find({"is_active": True}).sort("table_number", 1)
    async for session in cursor:
        session["_id"] = str(session["_id"])
        tables.append(session)
    return {"active_tables": tables, "total": len(tables)}


# ─── Dev-only customer bootstrap (no staff login required) ────────────────

if not settings.is_production:

    @router.post("/dev-session", status_code=201)
    async def dev_create_session(language: str = "en"):
        """DEV ONLY. Public endpoint to self-bootstrap a customer ticket by auto-allocating an available table."""
        db = get_database()
        now = utcnow()
        
        # Find all currently active tables
        active_cursor = db.table_sessions.find({"is_active": True}, {"table_number": 1})
        active_tables = set()
        async for s in active_cursor:
            active_tables.add(s["table_number"])
            
        # Find an available table between 1 and 20
        available_table = None
        for i in range(1, 21):
            if i not in active_tables:
                available_table = i
                break
                
        if not available_table:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No tables are currently available")
            
        table_number = available_table

        session_id = f"SES-{uuid.uuid4().hex[:12].upper()}"
        session_dict = {
            "table_number": table_number,
            "session_id": session_id,
            "is_active": True,
            "language": language,
            "created_at": now,
            "created_by": "dev-session",
            "ended_at": None,
        }
        result = await db.table_sessions.insert_one(session_dict)
        session_dict["_id"] = str(result.inserted_id)

        return {
            **session_dict,
            "customer_ticket": create_customer_ticket(table_number, session_id),
            "ticket_type": "bearer",
        }


# ─── Customer endpoint ────────────────────────────────────────────────────
