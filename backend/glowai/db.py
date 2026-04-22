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
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            import sys
            print("ERROR: Missing Supabase credentials", file=sys.stderr)
            print(f"SUPABASE_URL: {'set' if SUPABASE_URL else 'NOT SET'}", file=sys.stderr)
            print(f"SUPABASE_SERVICE_KEY: {'set' if SUPABASE_SERVICE_KEY else 'NOT SET'}", file=sys.stderr)
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            import sys
            print(f"✓ Supabase client created successfully for {SUPABASE_URL}", file=sys.stderr)
        except Exception as e:
            import sys
            print(f"ERROR creating Supabase client: {type(e).__name__}: {str(e)}", file=sys.stderr)
            raise
    return _client


def init_db():
    """
    Tables are created via Supabase dashboard SQL editor.
    This function is a no-op — kept for compatibility with app.py.
    Run the SQL in supabase_schema.sql once in your Supabase SQL editor.
    """
    pass
