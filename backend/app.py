import os
import sys
import traceback
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from glowai.api.analysis_bp import analysis_bp
from glowai.api.recommendation_bp import recommendation_bp
from glowai.api.report_bp import report_bp
from glowai.api.product_bp import product_bp
from glowai.api.profile_bp import profile_bp
from glowai.api.chat_bp import chat_bp
from glowai.auth.routes import auth_bp

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")

# Allowed origins — local dev + Vercel production + preview deployments
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
]

# Support Vercel preview deployments (*.vercel.app)
VERCEL_DOMAIN_PATTERN = r"https://.*\.vercel\.app"


def create_app():
    app = Flask(__name__, static_folder=None)
    
    # CORS configuration with support for Vercel preview deployments
    import re
    
    def is_allowed_origin(origin):
        """Check if origin is allowed (including Vercel preview deployments)"""
        if not origin:
            return False
        # Check exact matches
        if origin in ALLOWED_ORIGINS:
            return True
        # Check Vercel domain pattern
        if re.match(VERCEL_DOMAIN_PATTERN, origin):
            return True
        return False
    
    # Configure CORS with custom origin checker
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}},  # Allow all for now, validate in requests
         supports_credentials=True)
    
    # Add custom CORS validation
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        if origin and is_allowed_origin(origin):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB

    # Don't initialize database on import - do it lazily on first request
    # This prevents errors during cold starts
    
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

    # Health check endpoint
    @app.route("/api/health")
    def health_check():
        try:
            from glowai.db import get_db
            from glowai.supabase_auth import is_configured as auth_configured
            
            # Test database connection
            db = get_db()
            
            # Test a simple query
            result = db.table("users").select("id").limit(1).execute()
            
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "supabase_auth": "configured" if auth_configured() else "not_configured",
                "environment": "production" if os.environ.get("VERCEL") else "development"
            }), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                "status": "unhealthy",
                "error": str(e),
                "type": type(e).__name__
            }), 500

    @app.errorhandler(400)
    def bad_request(e):
        # Ensure error is a string
        error_msg = str(e) if e else "Bad request"
        return jsonify({"error": error_msg}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        error_msg = str(e) if e else "Unauthorized"
        return jsonify({"error": error_msg}), 401

    @app.errorhandler(403)
    def forbidden(e):
        error_msg = str(e) if e else "Forbidden"
        return jsonify({"error": error_msg}), 403

    @app.errorhandler(404)
    def not_found(e):
        error_msg = str(e) if e else "Not found"
        return jsonify({"error": error_msg}), 404

    @app.errorhandler(500)
    def internal_error(e):
        import traceback
        import sys
        # Log the full error
        print("=" * 80, file=sys.stderr)
        print("500 INTERNAL SERVER ERROR:", file=sys.stderr)
        print(str(e), file=sys.stderr)
        traceback.print_exc()
        print("=" * 80, file=sys.stderr)
        # Return string error message
        error_msg = str(e) if e else "Internal server error"
        return jsonify({"error": error_msg}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        import sys
        # Log the full error
        print("=" * 80, file=sys.stderr)
        print("UNHANDLED EXCEPTION:", file=sys.stderr)
        print(f"{type(e).__name__}: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        print("=" * 80, file=sys.stderr)
        # Return string error message
        error_msg = str(e) if e else "Server error"
        return jsonify({"error": error_msg, "type": type(e).__name__}), 500

    return app


# Create app instance for Vercel
# Ensure 'app' is always defined at module level for Vercel
app = None

try:
    app = create_app()
    print("✓ Flask app created successfully", file=sys.stderr)
except Exception as e:
    print("=" * 80, file=sys.stderr)
    print("FATAL ERROR: Failed to create Flask app", file=sys.stderr)
    print(f"{type(e).__name__}: {str(e)}", file=sys.stderr)
    traceback.print_exc()
    print("=" * 80, file=sys.stderr)
    
    # Create a minimal error app that shows the initialization error
    app = Flask(__name__)
    
    @app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    @app.route('/', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    def error_handler(path=''):
        return jsonify({
            "error": "app_initialization_failed",
            "message": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
