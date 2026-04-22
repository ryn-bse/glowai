from flask import Blueprint, jsonify, request
from glowai.auth.decorators import require_auth
from glowai.models.analysis import get_history_for_user
from glowai.pipeline.recommender import recommend
from bson import ObjectId

recommendation_bp = Blueprint("recommendations", __name__)


def _serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


@recommendation_bp.route("/current", methods=["GET"])
@require_auth
def get_current_recommendations():
    user = request.current_user
    history = get_history_for_user(str(user["_id"]))
    if not history:
        return jsonify({"recommendations": [], "message": "No analysis found. Submit a skin analysis first."}), 200
    latest = history[0]
    recommendations = latest.get("recommendations", [])
    return jsonify({"recommendations": _serialize(recommendations)}), 200


@recommendation_bp.route("/refresh", methods=["POST"])
@require_auth
def refresh_recommendations():
    user = request.current_user
    history = get_history_for_user(str(user["_id"]))
    if not history:
        return jsonify({"error": "No analysis found. Submit a skin analysis first."}), 404
    latest = history[0]
    try:
        new_recs = recommend(latest, user)
        from glowai.db import get_cursor
        with get_cursor() as cur:
            import json
            cur.execute(
                "UPDATE analyses SET recommendations=%s WHERE id=%s",
                (json.dumps(new_recs), latest["id"])
            )
        return jsonify({"recommendations": _serialize(new_recs)}), 200
    except Exception as e:
        return jsonify({"error": "recommendation_failed", "message": str(e)}), 500
