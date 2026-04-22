from glowai.db import get_db


def create_user(data: dict) -> dict:
    db = get_db()
    row = db.table("users").insert({
        "email": data["email"].lower().strip(),
        "password_hash": data.get("password_hash", ""),
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "phone": data.get("phone", ""),
        "date_of_birth": data.get("date_of_birth") or None,
        "gender": data.get("gender"),
        "skin_type": data.get("skin_type"),
        "primary_concern": data.get("primary_concern"),
        "skin_tone": data.get("skin_tone"),
        "known_allergies": data.get("known_allergies", []),
        "oauth_provider": data.get("oauth_provider"),
        "oauth_id": data.get("oauth_id"),
    }).execute()
    return _to_dict(row.data[0])


def find_by_email(email: str) -> dict | None:
    db = get_db()
    res = db.table("users").select("*").eq("email", email.lower().strip()).is_("deleted_at", "null").execute()
    return _to_dict(res.data[0]) if res.data else None


def find_by_id(user_id: str) -> dict | None:
    db = get_db()
    res = db.table("users").select("*").eq("id", str(user_id)).is_("deleted_at", "null").execute()
    return _to_dict(res.data[0]) if res.data else None


def update_profile(user_id: str, profile_data: dict) -> dict | None:
    db = get_db()
    res = db.table("users").update({
        "skin_type": profile_data.get("skin_type"),
        "primary_concern": profile_data.get("primary_concern"),
        "skin_tone": profile_data.get("skin_tone"),
        "known_allergies": profile_data.get("known_allergies", []),
    }).eq("id", str(user_id)).execute()
    return _to_dict(res.data[0]) if res.data else None


def soft_delete(user_id: str) -> None:
    from datetime import datetime, timezone
    db = get_db()
    db.table("users").update({"deleted_at": datetime.now(timezone.utc).isoformat()}).eq("id", str(user_id)).execute()


def _to_dict(row: dict) -> dict:
    if not row:
        return None
    d = dict(row)
    d["_id"] = str(d["id"])
    d["skin_profile"] = {
        "skin_type": d.get("skin_type"),
        "primary_concern": d.get("primary_concern"),
        "skin_tone": d.get("skin_tone"),
        "known_allergies": d.get("known_allergies") or [],
    }
    return d
