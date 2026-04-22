from functools import wraps
from flask import request, jsonify
from glowai.auth.service import validate_jwt, AuthError
from glowai.models.session import find_valid_session
from glowai.models.user import find_by_id


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "unauthorized"}), 401
        token = auth_header[7:]
        try:
            payload = validate_jwt(token)
        except AuthError as e:
            return jsonify({"error": "unauthorized"}), 401

        session = find_valid_session(token)
        if not session:
            return jsonify({"error": "unauthorized"}), 401

        user = find_by_id(payload["user_id"])
        if not user:
            return jsonify({"error": "unauthorized"}), 401

        request.current_user = user
        request.current_token = token
        return f(*args, **kwargs)
    return decorated
