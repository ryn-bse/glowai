from flask import Blueprint, jsonify, request
from glowai.auth.decorators import require_auth
from glowai.models.user import update_profile, find_by_id
from bson import ObjectId

profile_bp = Blueprint("profile", __name__)

VALID_SKIN_TYPES = {"oily", "dry", "combination", "normal", "sensitive"}


def _serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


@profile_bp.route("/", methods=["GET"])
@require_auth
def get_profile():
    user = request.current_user
    return jsonify(_serialize(user)), 200


@profile_bp.route("/", methods=["PUT"])
@require_auth
def update_user_profile():
    user = request.current_user
    data = request.get_json() or {}

    skin_type = data.get("skin_type")
    if skin_type and skin_type not in VALID_SKIN_TYPES:
        return jsonify({"error": "validation_error", "fields": {"skin_type": "Invalid skin type."}}), 400

    profile_data = {
        "skin_type": skin_type or user.get("skin_profile", {}).get("skin_type"),
        "primary_concern": data.get("primary_concern", user.get("skin_profile", {}).get("primary_concern")),
        "skin_tone": data.get("skin_tone", user.get("skin_profile", {}).get("skin_tone")),
        "known_allergies": data.get("known_allergies", user.get("skin_profile", {}).get("known_allergies", [])),
    }

    updated_user = update_profile(str(user["_id"]), profile_data)
    if not updated_user:
        return jsonify({"error": "not_found"}), 404

    return jsonify(_serialize(updated_user)), 200
