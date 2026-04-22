from flask import Blueprint, request, jsonify
from glowai.auth.service import (
    register_user, login_user, logout_user,
    validate_step, RegistrationValidationError, AuthError
)
from glowai.auth.oauth import google_login_redirect, google_callback_handler
from glowai.auth.decorators import require_auth
from bson import ObjectId

auth_bp = Blueprint("auth", __name__)


def _serialize(doc: dict) -> dict:
    """Convert ObjectId fields to strings for JSON serialization."""
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = _serialize(v)
        else:
            result[k] = v
    return result


@auth_bp.route("/validate-step", methods=["POST"])
def validate_step_route():
    data = request.get_json() or {}
    step = data.get("step")
    fields = data.get("fields", {})
    if step not in (1, 2, 3):
        return jsonify({"error": "Invalid step"}), 400
    errors = validate_step(step, fields)
    if errors:
        return jsonify({"valid": False, "errors": errors}), 422
    return jsonify({"valid": True}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    step1 = data.get("step1", {})
    step2 = data.get("step2", {})
    step3 = data.get("step3", {})
    try:
        user, token = register_user(step1, step2, step3)
        return jsonify({"user": _serialize(user), "token": token}), 201
    except RegistrationValidationError as e:
        return jsonify({"error": "validation_error", "fields": e.field_errors}), 400
    except AuthError as e:
        return jsonify({"error": e.message}), e.status
    except Exception as e:
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "")
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"error": "validation_error", "fields": {"email": "Required", "password": "Required"}}), 400
    try:
        user, token = login_user(email, password)
        return jsonify({"user": _serialize(user), "token": token}), 200
    except AuthError as e:
        return jsonify({"error": e.message}), e.status


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    logout_user(request.current_token)
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/oauth/google")
def google_login():
    return google_login_redirect()


@auth_bp.route("/oauth/google/callback")
def google_callback():
    return google_callback_handler()


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify(_serialize(request.current_user)), 200
