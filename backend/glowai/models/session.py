import hashlib
from datetime import datetime, timezone, timedelta
from glowai.db import get_db

SESSION_TTL_HOURS = 24


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(user_id: str, token: str) -> dict:
    db = get_db()
    expires = (datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)).isoformat()
    try:
        res = db.table("sessions").upsert({
            "user_id": str(user_id),
            "token_hash": _hash(token),
            "expires_at": expires,
            "invalidated": False,
        }, on_conflict="token_hash").execute()
        return res.data[0] if res.data else {}
    except Exception:
        return {}


def invalidate_session(token: str) -> None:
    db = get_db()
    db.table("sessions").update({"invalidated": True}).eq("token_hash", _hash(token)).execute()


def find_valid_session(token: str) -> dict | None:
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    res = (db.table("sessions")
           .select("*")
           .eq("token_hash", _hash(token))
           .eq("invalidated", False)
           .gt("expires_at", now)
           .execute())
    return res.data[0] if res.data else None
