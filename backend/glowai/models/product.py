from glowai.db import get_db

REQUIRED_FIELDS = ["name", "brand", "category", "ingredients",
                   "target_skin_types", "target_conditions", "image_url"]


class ValidationError(Exception):
    def __init__(self, missing_fields: list[str]):
        self.missing_fields = missing_fields
        super().__init__(f"Missing required fields: {missing_fields}")


def _validate(data: dict) -> None:
    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        raise ValidationError(missing)


def insert_product(data: dict) -> dict:
    _validate(data)
    db = get_db()
    res = db.table("products").insert({
        "name": data["name"],
        "brand": data["brand"],
        "category": data["category"],
        "ingredients": data["ingredients"],
        "target_skin_types": data["target_skin_types"],
        "target_conditions": data["target_conditions"],
        "image_url": data["image_url"],
    }).execute()
    return _to_dict(res.data[0])


def update_product(product_id: str, data: dict) -> dict | None:
    _validate(data)
    db = get_db()
    res = db.table("products").update({
        "name": data["name"], "brand": data["brand"], "category": data["category"],
        "ingredients": data["ingredients"], "target_skin_types": data["target_skin_types"],
        "target_conditions": data["target_conditions"], "image_url": data["image_url"],
    }).eq("id", str(product_id)).execute()
    return _to_dict(res.data[0]) if res.data else None


def query_products(skin_type: str | None = None,
                   skin_condition: str | None = None,
                   exclude_ingredients: list[str] | None = None) -> list[dict]:
    db = get_db()
    query = db.table("products").select("*")
    if skin_type:
        query = query.contains("target_skin_types", [skin_type])
    if skin_condition:
        query = query.contains("target_conditions", [skin_condition])
    res = query.execute()
    products = [_to_dict(r) for r in res.data]
    # Client-side allergen exclusion
    if exclude_ingredients:
        excl = {e.lower() for e in exclude_ingredients}
        products = [p for p in products if not any(i.lower() in excl for i in p.get("ingredients", []))]
    return products


def _to_dict(row: dict) -> dict:
    if not row:
        return None
    d = dict(row)
    d["_id"] = str(d["id"])
    return d
