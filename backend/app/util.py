"""Project-wide utilities. Keep tiny and dependency-free."""
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Single source of truth for 'now'. Always timezone-aware UTC.

    All persisted timestamps must come through this helper so sales/admin
    aggregations on `created_at` / `updated_at` see comparable values.
    """
    return datetime.now(timezone.utc)
