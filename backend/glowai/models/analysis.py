from glowai.db import get_db


def save_analysis(user_id: str, data: dict) -> dict:
    db = get_db()
    res = db.table("analyses").insert({
        "user_id": str(user_id),
        "image_url": data.get("image_url", ""),
        "skin_type": data["skin_type"],
        "skin_type_confidence": data["skin_type_confidence"],
        "low_confidence_flag": data.get("low_confidence_flag", False),
        "conditions": data.get("conditions", []),
        "face_regions": data.get("face_regions", {}),
        "recommendations": data.get("recommendations", []),
    }).execute()
    return _to_dict(res.data[0])


def get_by_id(analysis_id: str) -> dict | None:
    db = get_db()
    res = db.table("analyses").select("*").eq("id", str(analysis_id)).execute()
    return _to_dict(res.data[0]) if res.data else None


def get_history_for_user(user_id: str) -> list[dict]:
    db = get_db()
    res = db.table("analyses").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    return [_to_dict(r) for r in res.data]


def update_report_url(analysis_id: str, report_url: str) -> None:
    db = get_db()
    db.table("analyses").update({"report_url": report_url}).eq("id", str(analysis_id)).execute()


def _to_dict(row: dict) -> dict:
    if not row:
        return None
    d = dict(row)
    d["_id"] = str(d["id"])
    d["user_id"] = str(d["user_id"])
    return d
