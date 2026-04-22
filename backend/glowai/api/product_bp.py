from flask import Blueprint, jsonify, request
from glowai.auth.decorators import require_auth
from glowai.models.product import insert_product, update_product, query_products, ValidationError
from bson import ObjectId

product_bp = Blueprint("products", __name__)


def _serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


@product_bp.route("/", methods=["GET"])
def list_products():
    skin_type = request.args.get("skin_type")
    skin_condition = request.args.get("skin_condition")
    products = query_products(skin_type=skin_type, skin_condition=skin_condition)
    return jsonify([_serialize(p) for p in products]), 200


@product_bp.route("/", methods=["POST"])
@require_auth
def create_product():
    data = request.get_json() or {}
    try:
        product = insert_product(data)
        return jsonify(_serialize(product)), 201
    except ValidationError as e:
        return jsonify({"error": "validation_error", "fields": e.missing_fields}), 400


@product_bp.route("/<product_id>", methods=["PUT"])
@require_auth
def update_product_route(product_id: str):
    data = request.get_json() or {}
    try:
        product = update_product(product_id, data)
        if not product:
            return jsonify({"error": "not_found"}), 404
        return jsonify(_serialize(product)), 200
    except ValidationError as e:
        return jsonify({"error": "validation_error", "fields": e.missing_fields}), 400
    except Exception:
        return jsonify({"error": "not_found"}), 404
