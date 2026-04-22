"""
Supabase database layer using the Supabase Python client (REST API).
Works everywhere including Vercel serverless — no direct TCP connection needed.
"""
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://oufkyoraefgryjxjbiep.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def init_db():
    """
    Tables are created via Supabase dashboard SQL editor.
    This function is a no-op — kept for compatibility with app.py.
    Run the SQL in supabase_schema.sql once in your Supabase SQL editor.
    """
    pass
