"""
One-shot migration: copy rows from the legacy `admins` collection into the
unified `users` collection, then drop `admins`.

Run with:
    cd backend && python -m tools.migrate_admins_to_users

Idempotent: re-running after a successful migration is a no-op (the source
collection is gone). Safe to dry-run first via `--dry-run`.

Conflict policy:
  - If a `users.username` already exists, that row WINS — the legacy admins
    row is logged and skipped (NEVER silently overwritten). This avoids the
    privilege-escalation vector noted as L5 in the audit.
"""
import argparse
import asyncio
import sys
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def migrate(dry_run: bool) -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    if "admins" not in await db.list_collection_names():
        print("✅ No legacy `admins` collection found — nothing to migrate.")
        return 0

    legacy_count = await db.admins.count_documents({})
    print(f"Found {legacy_count} row(s) in legacy `admins` collection.")

    moved = 0
    skipped: list[str] = []
    conflicts: list[str] = []

    async for legacy in db.admins.find({}):
        username = legacy.get("username")
        if not username:
            skipped.append(f"<missing username, _id={legacy.get('_id')}>")
            continue

        existing = await db.users.find_one({"username": username})
        if existing:
            # Conflict: keep the existing users row, never overwrite.
            conflicts.append(username)
            continue

        merged = {
            "username": username,
            "password_hash": legacy.get("password_hash"),
            "full_name": legacy.get("full_name") or username,
            "role": legacy.get("role") or "admin",
            "email": legacy.get("email"),
            "phone": legacy.get("phone"),
            "is_active": legacy.get("is_active", True),
            "created_at": legacy.get("created_at") or _utcnow(),
            "updated_at": _utcnow(),
            "migrated_from_admins_at": _utcnow(),
        }

        if dry_run:
            print(f"  [dry-run] would insert: {username} (role={merged['role']})")
        else:
            await db.users.insert_one(merged)
            print(f"  ✅ migrated: {username} (role={merged['role']})")
        moved += 1

    print()
    print(f"Migrated:  {moved}")
    print(f"Conflicts: {len(conflicts)}  (left untouched in `users`)")
    for u in conflicts:
        print(f"    - {u}: already exists in `users`; legacy `admins` row left in place")
    print(f"Skipped:   {len(skipped)}")
    for s in skipped:
        print(f"    - {s}")

    if dry_run:
        print("\n(dry-run; no changes written)")
        client.close()
        return 0

    if conflicts:
        print("\n⚠ Conflicts detected. Resolve them manually before dropping `admins`.")
        print("  Re-run with --force-drop after resolving to remove the legacy collection.")
        client.close()
        return 1

    await db.admins.drop()
    print("\n🗑  Dropped legacy `admins` collection.")
    client.close()
    return 0


async def force_drop() -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    if "admins" in await db.list_collection_names():
        await db.admins.drop()
        print("🗑  Dropped legacy `admins` collection.")
    else:
        print("Nothing to drop.")
    client.close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate legacy `admins` → unified `users`.")
    parser.add_argument("--dry-run", action="store_true", help="Report only; write nothing")
    parser.add_argument("--force-drop", action="store_true",
                        help="Just drop the legacy `admins` collection (use after resolving conflicts)")
    args = parser.parse_args()

    if args.force_drop:
        return asyncio.run(force_drop())
    return asyncio.run(migrate(dry_run=args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
