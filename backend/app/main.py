"""S.A.F.E Table API — entrypoint with hardened WebSockets and rate limiting."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo, get_database
from app.routes.auth import decode_token, limiter
from app.websockets.kitchen import manager

# ─── Routers ──────────────────────────────────────────────────────────────
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.chatbot import router as chatbot_router
from app.routes.feedback import router as feedback_router
from app.routes.languages import router as languages_router
from app.routes.menu import router as menu_router
from app.routes.models3d import router as models3d_router
from app.routes.orders import router as orders_router
from app.routes.payments import router as payments_router
from app.routes.sales import router as sales_router
from app.routes.staff import router as staff_router
from app.routes.stripe_payments import router as stripe_router
from app.routes.safepay_payments import router as safepay_router
from app.routes.tables import router as tables_router
from app.routes.tasks import router as tasks_router
from app.routes.voice import router as voice_router
from app.routes.service_requests import router as service_requests_router
KITCHEN_WS_ROLES = {"kitchen", "manager", "admin"}
ALLOWED_WS_ORIGINS = set(settings.cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown events."""
    await connect_to_mongo()
    if not settings.is_production:
        from app.services.dev_seed import ensure_dev_staff

        db = get_database()
        stats = await ensure_dev_staff(db)
        print(
            "Dev staff bootstrap: "
            f"inserted {stats['inserted']}, updated {stats['updated']}"
        )
    print("🚀 S.A.F.E Table API is starting up...")
    yield
    await close_mongo_connection()
    print("👋 S.A.F.E Table API is shutting down...")


app = FastAPI(
    title="S.A.F.E Table API",
    description=(
        "Smart AI Fusion Experience Dining Table — Backend API\n\n"
        "## Features\n"
        "- 🍽️ Menu & Orders management\n"
        "- 🎤 Voice ordering (Whisper → Groq → HeyGen)\n"
        "- 🤖 AI Chatbot & Personalization (SAGE)\n"
        "- 💳 QR Payments (Stripe)\n"
        "- 🌍 12-Language Multilingual support\n"
        "- 👥 Staff management (all roles)\n"
        "- 📊 Sales reporting\n"
        "- ✅ Task management (Server & Cleaner portals)\n"
    ),
    version="2.2.0",
    lifespan=lifespan,
    swagger_ui_parameters={"withCredentials": True},
)

# ─── Rate limiting (slowapi) ──────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Customer-Ticket"],
)

for r in (
    auth_router, admin_router, staff_router,
    menu_router, orders_router, tables_router,
    payments_router, stripe_router, safepay_router,
    voice_router, chatbot_router, languages_router,
    feedback_router, models3d_router,
    sales_router, tasks_router, service_requests_router,
):
    app.include_router(r)

# ─── Static files (images, 3D models) ─────────────────────────────────────
import os as _os
_static_dir = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), "static")
if _os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


# ─── WebSocket helpers ────────────────────────────────────────────────────

async def _close_with(websocket: WebSocket, code: int) -> None:
    try:
        await websocket.close(code=code)
    except RuntimeError:
        pass


async def _validate_origin(websocket: WebSocket) -> bool:
    origin = websocket.headers.get("origin")
    if origin not in ALLOWED_WS_ORIGINS:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return False
    return True


# ─── WebSocket Endpoints ──────────────────────────────────────────────────

@app.websocket("/ws/kitchen")
async def websocket_kitchen(
    websocket: WebSocket,
    token: str | None = Query(default=None),
):
    """Kitchen real-time stream. Requires a staff JWT in ?token= and a
    role in {kitchen, manager, admin}. Inbound messages are drained but
    never acted upon — state changes go through the REST PATCH route."""
    if not await _validate_origin(websocket):
        return
    if not token:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = decode_token(token)
    except HTTPException:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return
    if payload.get("role") not in KITCHEN_WS_ROLES:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_kitchen(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_kitchen(websocket)


@app.websocket("/ws/customer/{table_number}")
async def websocket_customer(
    websocket: WebSocket,
    table_number: int,
    session_id: str | None = Query(default=None),
):
    """Customer table stream. (table_number, session_id) must match an
    active row in `table_sessions`."""
    if not await _validate_origin(websocket):
        return
    if not session_id or table_number < 1:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return

    db = get_database()
    sess = await db.table_sessions.find_one({
        "session_id": session_id,
        "table_number": table_number,
        "is_active": True,
    })
    if not sess:
        await _close_with(websocket, status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_customer(websocket, table_number)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_customer(websocket, table_number)


# ─── Health Check ─────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "S.A.F.E Table API",
        "version": "2.2.0",
        "status": "running",
        "docs": "/docs",
        "features": [
            "menu", "orders", "voice", "payments", "stripe",
            "chatbot", "languages", "sales", "tasks", "staff", "auth",
        ],
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.database import client
    try:
        await client.admin.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    stripe_ok = bool(settings.STRIPE_SECRET_KEY) and not settings.STRIPE_SECRET_KEY.startswith("sk_test_placeholder")
    return {
        "status": "healthy",
        "database": db_status,
        "groq_api": "configured" if settings.GROQ_API_KEY else "not configured (using fallback)",
        "stripe": "configured" if stripe_ok else "simulated",
        "heygen": "configured" if settings.HEYGEN_API_KEY else "not configured",
    }