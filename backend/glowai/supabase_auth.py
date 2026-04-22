"""
Supabase Auth integration for GlowAI.
Handles user sign-up and sign-in via Supabase Auth,
storing credentials securely in Supabase instead of MongoDB.
"""
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

_client: Client | None = None


def get_auth_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def supabase_register(email: str, password: str) -> dict:
    """
    Register a new user in Supabase Auth.
    Uses admin API to auto-confirm email so users can log in immediately.
    Returns Supabase user dict on success.
    Raises ValueError on failure.
    """
    # Use service role client for admin operations
    service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not service_key:
        raise RuntimeError("SUPABASE_SERVICE_KEY must be set")

    admin_client = create_client(SUPABASE_URL, service_key)
    try:
        # Create user via admin API — auto-confirms email
        res = admin_client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # skip email confirmation
        })
        if res.user is None:
            raise ValueError("Registration failed.")
        return {"id": res.user.id, "email": res.user.email}
    except Exception as e:
        msg = str(e)
        if "already registered" in msg.lower() or "already been registered" in msg.lower() or "already exists" in msg.lower():
            raise ValueError("An account with this email already exists.")
        raise ValueError(f"Registration failed: {msg}")


def supabase_login(email: str, password: str) -> dict:
    """
    Sign in via Supabase Auth.
    Returns Supabase user dict on success.
    Raises ValueError with generic message on failure.
    """
    client = get_auth_client()
    try:
        res = client.auth.sign_in_with_password({"email": email, "password": password})
        if res.user is None:
            raise ValueError("Invalid credentials.")
        return {"id": res.user.id, "email": res.user.email}
    except Exception as e:
        msg = str(e)
        if "invalid" in msg.lower() or "credentials" in msg.lower() or "password" in msg.lower():
            raise ValueError("Invalid credentials.")
        raise ValueError("Invalid credentials.")
