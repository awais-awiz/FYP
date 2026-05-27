"""Dev-only seed helpers to keep default staff accounts usable."""
from passlib.context import CryptContext
from app.util import utcnow

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
DEFAULT_PASSWORDS = {
    "admin": "admin123",
    "manager": "manager123",
    "kitchen": "kitchen123",
    "server": "server123",
    "cleaner": "cleaner123",
}

DEFAULT_STAFF_ACCOUNTS = [
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


async def ensure_dev_staff(db) -> dict:
    """Upsert default staff accounts so dev login always works."""
    now = utcnow()
    inserted = 0
    updated = 0

    for staff in DEFAULT_STAFF_ACCOUNTS:
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
            inserted += 1
        else:
            updated += 1

        if staff["role"] == "admin":
            await db.admins.update_one(
                {"username": staff["username"]},
                {"$set": staff_doc, "$setOnInsert": {"created_at": now}},
                upsert=True,
            )

    return {"inserted": inserted, "updated": updated}
