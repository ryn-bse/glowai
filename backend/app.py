import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from glowai.api.analysis_bp import analysis_bp
from glowai.api.recommendation_bp import recommendation_bp
from glowai.api.report_bp import report_bp
from glowai.api.product_bp import product_bp
from glowai.api.profile_bp import profile_bp
from glowai.api.chat_bp import chat_bp
from glowai.auth.routes import auth_bp

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")

# Allowed origins — local dev + Vercel production
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
]


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app, resources={r"/api/*": {"origins": [o for o in ALLOWED_ORIGINS if o]}})
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB

    # Initialize database tables
    from glowai.db import init_db
    init_db()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(recommendation_bp, url_prefix="/api/recommendations")
    app.register_blueprint(report_bp, url_prefix="/api/report")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    # Serve uploaded images
    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(os.path.abspath(UPLOAD_DIR), filename)

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not_found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "internal_error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
