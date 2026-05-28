"""
Expanded Seed Script — S.A.F.E Table
Populates MongoDB with:
  - All 5 staff role accounts
  - 17 menu items (Main, Appetizers, Desserts, Beverages)
  - 6 dummy orders (various statuses)
  - 3 dummy feedback records
  - 5 table ambience presets
  - 2 active table sessions
  - 4 sample tasks (server + cleaner)
  - 3 approval requests
  - 2 dummy chat sessions

Run: python seed_data.py
From: backend/ directory
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
import uuid
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "safetable")

# ─── Default Passwords ────────────────────────────────────────────────────
# Default passwords follow the <role>123 pattern (e.g. admin123, kitchen123)
DEFAULT_PASSWORDS = {
    "admin": "admin123",
    "manager": "manager123",
    "kitchen": "kitchen123",
    "server": "server123",
    "cleaner": "cleaner123",
}

# ─── Staff Accounts ───────────────────────────────────────────────────────
STAFF_ACCOUNTS = [
    {
        "username": "admin",
        "password": DEFAULT_PASSWORDS["admin"],
        "full_name": "System Admin",
        "role": "admin",
        "email": "admin@safetable.com",
        "phone": "+1-555-0001",
        "is_active": True,
    },
    {
        "username": "manager",
        "password": DEFAULT_PASSWORDS["manager"],
        "full_name": "Sarah Manager",
        "role": "manager",
        "email": "manager@safetable.com",
        "phone": "+1-555-0002",
        "is_active": True,
    },
    {
        "username": "kitchen",
        "password": DEFAULT_PASSWORDS["kitchen"],
        "full_name": "Chef Ahmad",
        "role": "kitchen",
        "email": "kitchen@safetable.com",
        "phone": "+1-555-0003",
        "is_active": True,
    },
    {
        "username": "server",
        "password": DEFAULT_PASSWORDS["server"],
        "full_name": "Sam Server",
        "role": "server",
        "email": "server@safetable.com",
        "phone": "+1-555-0004",
        "is_active": True,
    },
    {
        "username": "server1",
        "password": DEFAULT_PASSWORDS["server"],
        "full_name": "John Server",
        "role": "server",
        "email": "server1@safetable.com",
        "phone": "+1-555-0004",
        "is_active": True,
    },
    {
        "username": "cleaner",
        "password": DEFAULT_PASSWORDS["cleaner"],
        "full_name": "Cleo Cleaner",
        "role": "cleaner",
        "email": "cleaner@safetable.com",
        "phone": "+1-555-0005",
        "is_active": True,
    },
    {
        "username": "cleaner1",
        "password": DEFAULT_PASSWORDS["cleaner"],
        "full_name": "Maria Cleaner",
        "role": "cleaner",
        "email": "cleaner1@safetable.com",
        "phone": "+1-555-0005",
        "is_active": True,
    },
]

# ─── Menu Items ───────────────────────────────────────────────────────────
MENU_ITEMS = [
    {
        "name": "Caramel Pudding",
        "description": "Delicious Caramel Pudding",
        "price": 450,
        "category": "Desserts",
        "image_url": "/models/PosterImage/Caramel_Pudding.png",
        "model_3d_url": "/models/3dModels/Caramel_Pudding.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Chocolate Ice Cream",
        "description": "Delicious Chocolate Ice Cream",
        "price": 350,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Chocolate_Ice_Cream.png",
        "model_3d_url": "/models/3dModels/Chocolate_Ice_Cream.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Classis Beef Burgers",
        "description": "Delicious Classis Beef Burgers",
        "price": 1250,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Classis_Beef_Burgers.png",
        "model_3d_url": "/models/3dModels/Classis_Beef_Burgers.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Cold Coffee",
        "description": "Delicious Cold Coffee",
        "price": 550,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Cold_Coffee.png",
        "model_3d_url": "/models/3dModels/Cold_Coffee.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Creamy Chicken Alfredo Pasta",
        "description": "Delicious Creamy Chicken Alfredo Pasta",
        "price": 1450,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Creamy_Chicken_Alfredo_Pasta.png",
        "model_3d_url": "/models/3dModels/Creamy_Chicken_Alfredo_Pasta.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Crispy Fried Chicken",
        "description": "Delicious Crispy Fried Chicken",
        "price": 1100,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Crispy_Fried_Chicken.png",
        "model_3d_url": "/models/3dModels/Crispy_Fried_Chicken.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Katsuobushi Poutine",
        "description": "Delicious Katsuobushi Poutine",
        "price": 1350,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Katsuobushi_Poutine.png",
        "model_3d_url": "/models/3dModels/Katsuobushi_Poutine.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Margherita Pizza",
        "description": "Delicious Margherita Pizza",
        "price": 1800,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Margherita_pizza.png",
        "model_3d_url": "/models/3dModels/Margherita_pizza.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Mint Margerita",
        "description": "Delicious Mint Margerita",
        "price": 480,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Mint_Margerita.png",
        "model_3d_url": "/models/3dModels/Mint_Margerita.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "New York Pizza",
        "description": "Delicious New York Pizza",
        "price": 2200,
        "category": "Main Course",
        "image_url": "/models/PosterImage/New_York_Pizza.png",
        "model_3d_url": "/models/3dModels/New_York_Pizza.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Oreo Shake",
        "description": "Delicious Oreo Shake",
        "price": 650,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Oreo_shake.png",
        "model_3d_url": "/models/3dModels/Oreo_shake.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Pepperoni Pizza",
        "description": "Delicious Pepperoni Pizza",
        "price": 2400,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Pepperoni_Pizza.png",
        "model_3d_url": "/models/3dModels/Pepperoni_Pizza.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Pina Colada",
        "description": "Delicious Pina Colada",
        "price": 700,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Pina_Colada.png",
        "model_3d_url": "/models/3dModels/Pina_Colada.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Raspberry Drizzled Cheese Cake",
        "description": "Delicious Raspberry Drizzled Cheese Cake",
        "price": 750,
        "category": "Desserts",
        "image_url": "/models/PosterImage/Raspberry_drizzled_cheese_cake.png",
        "model_3d_url": "/models/3dModels/Raspberry_drizzled_cheese_cake.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "S.A.F.E Special Burger Combo",
        "description": "Delicious S.A.F.E Special Burger Combo",
        "price": 1650,
        "category": "Main Course",
        "image_url": "/models/PosterImage/S.A.F.E_Special_Burger_combo.png",
        "model_3d_url": "/models/3dModels/S.A.F.E_Special_Burger_combo.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Strawberry Mojito",
        "description": "Delicious Strawberry Mojito",
        "price": 520,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Strawberry_Mojito.png",
        "model_3d_url": "/models/3dModels/Strawberry_Mojito.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Tomahawk Steak",
        "description": "Delicious Tomahawk Steak",
        "price": 4500,
        "category": "Main Course",
        "image_url": "/models/PosterImage/Tomahawk_Steak.png",
        "model_3d_url": "/models/3dModels/Tomahawk_Steak.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Beef Tenderloin Steak",
        "description": "Delicious Beef Tenderloin Steak",
        "price": 3800,
        "category": "Main Course",
        "image_url": "/models/PosterImage/beef_tenderloin_steak.png",
        "model_3d_url": "/models/3dModels/beef_tenderloin_steak.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    },
    {
        "name": "Aquafina Water",
        "description": "Refreshing Aquafina Bottled Water",
        "price": 5,
        "category": "Beverages",
        "image_url": "/models/PosterImage/Aquafina_Water.png",
        "model_3d_url": "/models/3dModels/Aquafina_Bottled_Water.glb",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 2, "spice_level": 0, "is_vegetarian": True, "is_popular": True,
    },
]


def _gen_order_id():
    ts = hex(int(datetime.utcnow().timestamp()))[2:].upper()
    rand = uuid.uuid4().hex[:4].upper()
    return f"ORD-{ts}-{rand}"


async def seed_database():
    """Main seeding function."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    now = datetime.utcnow()

    print(f"\n🌱 Seeding database: {DATABASE_NAME} at {MONGODB_URL}\n")

    # ── 1. Menu Items ──────────────────────────────────────────────────────
    existing_count = await db.menu_items.count_documents({})
    if existing_count > 0:
        print(f"   ⚠️  Menu has {existing_count} items. Clearing and re-seeding...")
        await db.menu_items.delete_many({})

    for item in MENU_ITEMS:
        item["created_at"] = now
        item["updated_at"] = now
        item["stock_quantity"] = 50

    result = await db.menu_items.insert_many(MENU_ITEMS)
    print(f"   ✅ Seeded {len(result.inserted_ids)} menu items")

    # ── 2. Staff Accounts (users collection) ──────────────────────────────
    inserted_staff = 0
    updated_staff = 0
    for staff in STAFF_ACCOUNTS:
        staff_doc = {
            **staff,
            "password_hash": pwd_context.hash(staff["password"]),
            "updated_at": now,
        }
        staff_doc.pop("password", None)
        result = await db.users.update_one(
            {"username": staff["username"]},
            {"$set": staff_doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        if result.upserted_id:
            inserted_staff += 1
        else:
            updated_staff += 1

        # Also keep admin in legacy admins collection for backward compat
        if staff["role"] == "admin":
            await db.admins.update_one(
                {"username": staff["username"]},
                {"$set": staff_doc, "$setOnInsert": {"created_at": now}},
                upsert=True,
            )

    print(
        f"   ✅ Seeded {inserted_staff}/{len(STAFF_ACCOUNTS)} staff accounts "
        f"(updated {updated_staff})"
    )
    print(
        "      Credentials: admin/admin123 | manager/manager123 | kitchen/kitchen123 | "
        "server/server123 | server1/server123 | cleaner/cleaner123 | cleaner1/cleaner123"
    )

    # ── 3. Dummy Orders ───────────────────────────────────────────────────
    existing_orders = await db.orders.count_documents({})
    if existing_orders == 0:
        dummy_orders = [
            {
                "order_id": _gen_order_id(),
                "table_number": 1,
                "items": [
                    {"menu_item_id": "dummy1", "name": "Wagyu Steak", "price": 89.99, "quantity": 2, "special_instructions": None},
                    {"menu_item_id": "dummy2", "name": "Truffle Risotto", "price": 45.99, "quantity": 1, "special_instructions": None},
                ],
                "total_price": 225.97,
                "status": "preparing",
                "payment_status": "unpaid",
                "order_source": "menu",
                "created_at": now - timedelta(minutes=15),
                "updated_at": now - timedelta(minutes=10),
                "estimated_ready_time": now + timedelta(minutes=10),
            },
            {
                "order_id": _gen_order_id(),
                "table_number": 2,
                "items": [
                    {"menu_item_id": "dummy3", "name": "Butter Chicken", "price": 32.99, "quantity": 1, "special_instructions": "No spice"},
                    {"menu_item_id": "dummy4", "name": "Fresh Mango Lassi", "price": 8.99, "quantity": 2, "special_instructions": None},
                ],
                "total_price": 50.97,
                "status": "ready",
                "payment_status": "unpaid",
                "order_source": "voice",
                "created_at": now - timedelta(minutes=30),
                "updated_at": now - timedelta(minutes=5),
                "estimated_ready_time": now - timedelta(minutes=5),
            },
            {
                "order_id": _gen_order_id(),
                "table_number": 3,
                "items": [
                    {"menu_item_id": "dummy5", "name": "Biryani Special", "price": 35.99, "quantity": 1, "special_instructions": None},
                    {"menu_item_id": "dummy6", "name": "Tiramisu", "price": 16.99, "quantity": 1, "special_instructions": None},
                    {"menu_item_id": "dummy7", "name": "Chai Latte", "price": 7.99, "quantity": 2, "special_instructions": None},
                ],
                "total_price": 68.96,
                "status": "completed",
                "payment_status": "paid",
                "order_source": "menu",
                "created_at": now - timedelta(hours=1),
                "updated_at": now - timedelta(minutes=20),
                "estimated_ready_time": now - timedelta(minutes=25),
            },
            {
                "order_id": _gen_order_id(),
                "table_number": 4,
                "items": [
                    {"menu_item_id": "dummy8", "name": "Seared Salmon", "price": 38.99, "quantity": 1, "special_instructions": None},
                    {"menu_item_id": "dummy9", "name": "Bruschetta", "price": 14.99, "quantity": 1, "special_instructions": None},
                ],
                "total_price": 53.98,
                "status": "pending",
                "payment_status": "unpaid",
                "order_source": "voice",
                "created_at": now - timedelta(minutes=5),
                "updated_at": now - timedelta(minutes=5),
                "estimated_ready_time": now + timedelta(minutes=20),
            },
            {
                "order_id": _gen_order_id(),
                "table_number": 5,
                "items": [
                    {"menu_item_id": "dummy10", "name": "Grilled Lamb Chops", "price": 62.99, "quantity": 2, "special_instructions": "Medium rare"},
                    {"menu_item_id": "dummy11", "name": "Chocolate Lava Cake", "price": 18.99, "quantity": 2, "special_instructions": None},
                    {"menu_item_id": "dummy12", "name": "Sparkling Lemonade", "price": 6.99, "quantity": 2, "special_instructions": None},
                ],
                "total_price": 177.94,
                "status": "confirmed",
                "payment_status": "unpaid",
                "order_source": "menu",
                "created_at": now - timedelta(minutes=8),
                "updated_at": now - timedelta(minutes=7),
                "estimated_ready_time": now + timedelta(minutes=30),
            },
            {
                "order_id": _gen_order_id(),
                "table_number": 1,
                "items": [
                    {"menu_item_id": "dummy13", "name": "Chicken Tikka", "price": 18.99, "quantity": 1, "special_instructions": None},
                    {"menu_item_id": "dummy14", "name": "Penne Arrabbiata", "price": 28.99, "quantity": 1, "special_instructions": "Extra cheese"},
                ],
                "total_price": 47.98,
                "status": "completed",
                "payment_status": "paid",
                "order_source": "menu",
                "created_at": now - timedelta(hours=2),
                "updated_at": now - timedelta(hours=1, minutes=30),
                "estimated_ready_time": now - timedelta(hours=1, minutes=45),
            },
        ]
        await db.orders.insert_many(dummy_orders)
        print(f"   ✅ Seeded {len(dummy_orders)} dummy orders")
    else:
        print(f"   ℹ️  Orders already exist ({existing_orders} records), skipping")

    # ── 4. Dummy Feedback ─────────────────────────────────────────────────
    existing_fb = await db.feedback.count_documents({})
    if existing_fb == 0:
        feedbacks = [
            {
                "feedback_id": f"FB-{uuid.uuid4().hex[:8].upper()}",
                "order_id": "ORD-SAMPLE-001",
                "table_number": 3,
                "text": "The Biryani Special was absolutely delicious! Perfect spice levels and amazing aroma. The service was also very attentive.",
                "rating": 5,
                "sentiment": "positive",
                "created_at": now - timedelta(hours=1),
            },
            {
                "feedback_id": f"FB-{uuid.uuid4().hex[:8].upper()}",
                "order_id": "ORD-SAMPLE-002",
                "table_number": 1,
                "text": "Food was good but the wait time was a bit long. The Wagyu Steak was cooked perfectly though.",
                "rating": 3,
                "sentiment": "neutral",
                "created_at": now - timedelta(hours=3),
            },
            {
                "feedback_id": f"FB-{uuid.uuid4().hex[:8].upper()}",
                "order_id": "ORD-SAMPLE-003",
                "table_number": 2,
                "text": "Exceptional dining experience! The AI voice ordering system is incredible and the food quality is top-notch. Will definitely come back!",
                "rating": 5,
                "sentiment": "positive",
                "created_at": now - timedelta(hours=5),
            },
        ]
        await db.feedback.insert_many(feedbacks)
        print(f"   ✅ Seeded {len(feedbacks)} feedback records")

    # ── 5. Table Sessions ─────────────────────────────────────────────────
    existing_sessions = await db.table_sessions.count_documents({"is_active": True})
    if existing_sessions == 0:
        sessions = [
            {
                "table_number": 1,
                "session_id": f"SES-{uuid.uuid4().hex[:8].upper()}",
                "is_active": True, "language": "en",
                "created_at": now - timedelta(hours=1), "ended_at": None,
            },
            {
                "table_number": 2,
                "session_id": f"SES-{uuid.uuid4().hex[:8].upper()}",
                "is_active": True, "language": "ur",
                "created_at": now - timedelta(minutes=45), "ended_at": None,
            },
            {
                "table_number": 4,
                "session_id": f"SES-{uuid.uuid4().hex[:8].upper()}",
                "is_active": True, "language": "de",
                "created_at": now - timedelta(minutes=10), "ended_at": None,
            },
        ]
        await db.table_sessions.insert_many(sessions)
        print(f"   ✅ Seeded {len(sessions)} active table sessions")

    # ── 6. Ambience Presets ───────────────────────────────────────────────
    existing_amb = await db.ambience.count_documents({})
    if existing_amb == 0:
        ambience_data = [
            {"table_number": 1, "brightness": 75,  "color_mode": "warm",       "preset": "default",          "music_volume": 50},
            {"table_number": 2, "brightness": 40,  "color_mode": "romantic",   "preset": "romantic_dinner",  "music_volume": 30},
            {"table_number": 3, "brightness": 90,  "color_mode": "warm",       "preset": "family_gathering", "music_volume": 60},
            {"table_number": 4, "brightness": 85,  "color_mode": "cool",       "preset": "business_meeting", "music_volume": 20},
            {"table_number": 5, "brightness": 100, "color_mode": "energetic",  "preset": "celebration",      "music_volume": 80},
        ]
        await db.ambience.insert_many(ambience_data)
        print(f"   ✅ Seeded {len(ambience_data)} ambience presets")

    # ── 7. Tasks ──────────────────────────────────────────────────────────
    existing_tasks = await db.tasks.count_documents({})
    if existing_tasks == 0:
        tasks = [
            {
                "task_id": f"TSK-{uuid.uuid4().hex[:8].upper()}",
                "title": "Serve Table 2 — Order Ready",
                "description": "Butter Chicken and Mango Lassi are ready for Table 2",
                "assigned_to": "server1", "role": "server",
                "priority": "high", "status": "pending",
                "table_number": 2, "due_time": "ASAP", "notes": None,
                "created_at": now, "updated_at": now,
            },
            {
                "task_id": f"TSK-{uuid.uuid4().hex[:8].upper()}",
                "title": "Water Refill — Table 5",
                "description": "Customers at Table 5 have requested water refill",
                "assigned_to": "server1", "role": "server",
                "priority": "medium", "status": "in_progress",
                "table_number": 5, "due_time": None, "notes": None,
                "created_at": now - timedelta(minutes=5), "updated_at": now - timedelta(minutes=3),
            },
            {
                "task_id": f"TSK-{uuid.uuid4().hex[:8].upper()}",
                "title": "Deep Clean Table 3",
                "description": "Table 3 guests have left. Full sanitisation required.",
                "assigned_to": "cleaner1", "role": "cleaner",
                "priority": "high", "status": "pending",
                "table_number": 3, "due_time": None, "notes": None,
                "created_at": now - timedelta(minutes=2), "updated_at": now - timedelta(minutes=2),
            },
            {
                "task_id": f"TSK-{uuid.uuid4().hex[:8].upper()}",
                "title": "Restock Paper Napkins",
                "description": "Paper napkins running low in the main dining area",
                "assigned_to": "cleaner1", "role": "cleaner",
                "priority": "low", "status": "completed",
                "table_number": None, "due_time": None,
                "notes": "Restocked from storage room B",
                "created_at": now - timedelta(hours=1), "updated_at": now - timedelta(minutes=30),
            },
        ]
        await db.tasks.insert_many(tasks)
        print(f"   ✅ Seeded {len(tasks)} tasks")

    # ── 8. Approval Requests ──────────────────────────────────────────────
    existing_app = await db.approvals.count_documents({})
    if existing_app == 0:
        approvals = [
            {
                "approval_id": f"APR-{uuid.uuid4().hex[:8].upper()}",
                "requested_by": "server1",
                "type": "leave_request",
                "title": "Annual Leave — 3 Days",
                "description": "Requesting 3 days annual leave from next Monday",
                "status": "pending",
                "created_at": now - timedelta(days=1),
                "reviewed_at": None,
            },
            {
                "approval_id": f"APR-{uuid.uuid4().hex[:8].upper()}",
                "requested_by": "kitchen",
                "type": "schedule_change",
                "title": "Shift Swap Request",
                "description": "Would like to swap Friday evening shift with cleaner1",
                "status": "pending",
                "created_at": now - timedelta(hours=6),
                "reviewed_at": None,
            },
            {
                "approval_id": f"APR-{uuid.uuid4().hex[:8].upper()}",
                "requested_by": "cleaner1",
                "type": "equipment_request",
                "title": "Industrial Mop Purchase",
                "description": "Current mop is worn out. Requesting replacement.",
                "status": "approved",
                "created_at": now - timedelta(days=2),
                "reviewed_at": now - timedelta(days=1),
            },
        ]
        await db.approvals.insert_many(approvals)
        print(f"   ✅ Seeded {len(approvals)} approval requests")

    # ── 9. Sample Chat Sessions ───────────────────────────────────────────
    existing_chats = await db.chat_sessions.count_documents({})
    if existing_chats == 0:
        chat_sessions = [
            {
                "session_id": "table-1-demo",
                "messages": [
                    {"role": "user",      "content": "Hello! What do you recommend?",                                   "timestamp": (now - timedelta(minutes=10)).isoformat()},
                    {"role": "assistant", "content": "Welcome! I'd recommend the Wagyu Steak — our most popular dish!",  "timestamp": (now - timedelta(minutes=9)).isoformat()},
                    {"role": "user",      "content": "Any vegetarian options?",                                          "timestamp": (now - timedelta(minutes=8)).isoformat()},
                    {"role": "assistant", "content": "Absolutely! Truffle Risotto and Penne Arrabbiata are excellent choices.", "timestamp": (now - timedelta(minutes=7)).isoformat()},
                ],
                "created_at": now - timedelta(minutes=10),
                "updated_at": now - timedelta(minutes=7),
            },
            {
                "session_id": "table-2-demo",
                "messages": [
                    {"role": "user",      "content": "Assalam o Alaikum! Kya Biryani available hai?",                   "timestamp": (now - timedelta(minutes=20)).isoformat()},
                    {"role": "assistant", "content": "Wa Alaikum Assalam! Ji haan, Biryani Special available hai aur bahut popular bhi hai!", "timestamp": (now - timedelta(minutes=19)).isoformat()},
                ],
                "created_at": now - timedelta(minutes=20),
                "updated_at": now - timedelta(minutes=19),
            },
        ]
        await db.chat_sessions.insert_many(chat_sessions)
        print(f"   ✅ Seeded {len(chat_sessions)} chat sessions")

    # ── 10. Database Indexes ──────────────────────────────────────────────
    await db.menu_items.create_index("category")
    await db.menu_items.create_index("is_available")
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("table_number")
    await db.orders.create_index("status")
    await db.orders.create_index("created_at")
    await db.payments.create_index("payment_id", unique=True)
    await db.payments.create_index("order_id")
    await db.feedback.create_index("feedback_id", unique=True)
    await db.table_sessions.create_index([("table_number", 1), ("is_active", 1)])
    await db.admins.create_index("username", unique=True)
    await db.users.create_index("username", unique=True)
    await db.tasks.create_index("task_id", unique=True)
    await db.tasks.create_index("assigned_to")
    await db.chat_sessions.create_index("session_id", unique=True)
    print("   ✅ Database indexes created")

    client.close()

    print("\n" + "="*55)
    print("  🎉 S.A.F.E Table Database Seeding Complete!")
    print("="*55)
    print(f"  Database   : {DATABASE_NAME}")
    print(f"  Menu Items : {len(MENU_ITEMS)}")
    print(f"  Staff      : {len(STAFF_ACCOUNTS)} accounts")
    print("")
    print("  Staff Login Credentials:")
    print("  ─────────────────────────────────────────────")
    print("  admin    / admin123   (Admin Portal)")
    print("  manager  / admin123   (Manager Portal)")
    print("  kitchen  / admin123   (Kitchen Dashboard)")
    print("  server1  / admin123   (Server Dashboard)")
    print("  cleaner1 / admin123   (Cleaner Dashboard)")
    print("="*55 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_database())
