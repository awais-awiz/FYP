"""
MongoDB connection + index management.
Fixed to resolve IndexOptionsConflict and ImportError.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
import logging
from app.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None  # type: ignore[assignment]


async def connect_to_mongo() -> None:
    """Connect, ping, and ensure indexes exist."""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        await client.admin.command("ping")
        await _ensure_indexes(client[settings.DATABASE_NAME])
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise e


async def close_mongo_connection() -> None:
    """Function required by main.py to gracefully shut down."""
    global client
    if client is not None:
        client.close()
        print("MongoDB connection closed")


def get_database():
    """Return the active database handle."""
    return client[settings.DATABASE_NAME]


async def _ensure_indexes(db) -> None:
    """
    Create all required indexes. 
    Names are set to match existing MongoDB defaults to avoid 'IndexOptionsConflict'.
    """
    # Users
    await db.users.create_index([("username", ASCENDING)], unique=True, name="username_1")
    await db.users.create_index([("role", ASCENDING)], name="role_1")

    # Orders
    await db.orders.create_index([("order_id", ASCENDING)], unique=True, name="order_id_1")
    await db.orders.create_index(
        [("status", ASCENDING), ("created_at", DESCENDING)],
        name="status_1_created_at_-1",
    )
    await db.orders.create_index(
        [("table_number", ASCENDING), ("created_at", DESCENDING)],
        name="table_number_1_created_at_-1",
    )
    await db.orders.create_index(
        [("payment_status", ASCENDING), ("created_at", DESCENDING)],
        name="payment_status_1_created_at_-1",
    )

    # Payments
    await db.payments.create_index([("payment_id", ASCENDING)], unique=True, name="payment_id_1")
    await db.payments.create_index([("payment_intent_id", ASCENDING)], sparse=True, name="payment_intent_id_1")
    await db.payments.create_index([("order_id", ASCENDING)], name="order_id_1")

    # Menu items
    await db.menu_items.create_index([("name", ASCENDING)], name="name_1")
    await db.menu_items.create_index([("category", ASCENDING)], name="category_1")

    # Table sessions
    await db.table_sessions.create_index(
        [("table_number", ASCENDING), ("is_active", ASCENDING)],
        name="table_number_1_is_active_1",
    )
    await db.table_sessions.create_index(
        [("session_id", ASCENDING)],
        unique=True,
        name="session_id_1",
    )

    # Stripe webhook idempotency
    await db.stripe_events.create_index(
        [("at", ASCENDING)],
        name="at_1",
        expireAfterSeconds=60 * 60 * 24 * 30,
    )

    # Refunds owed
    await db.refund_queue.create_index(
        [("status", ASCENDING), ("queued_at", ASCENDING)],
        name="status_1_queued_at_1",
    )
    await db.refund_queue.create_index(
        [("payment_intent_id", ASCENDING)],
        unique=True,
        sparse=True,
        name="payment_intent_id_1",
    )

    # Approvals
    await db.approvals.create_index(
        [("status", ASCENDING), ("created_at", DESCENDING)],
        name="status_1_created_at_-1",
    )