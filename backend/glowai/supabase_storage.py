"""
Supabase Storage integration for GlowAI.
Replaces local file storage for uploaded images and PDF reports.

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
"""
import os
import uuid
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BUCKET_IMAGES = "skin-images"
BUCKET_REPORTS = "reports"

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def upload_image(image_bytes: bytes, mime_type: str) -> str:
    """
    Upload a skin image to Supabase Storage.
    Returns the public URL.
    """
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map.get(mime_type, "jpg")
    filename = f"{uuid.uuid4()}.{ext}"

    client = get_client()
    client.storage.from_(BUCKET_IMAGES).upload(
        path=filename,
        file=image_bytes,
        file_options={"content-type": mime_type},
    )
    return client.storage.from_(BUCKET_IMAGES).get_public_url(filename)


def upload_report(pdf_bytes: bytes, analysis_id: str) -> str:
    """
    Upload a PDF report to Supabase Storage.
    Returns the public URL.
    """
    filename = f"report-{analysis_id}.pdf"
    client = get_client()
    client.storage.from_(BUCKET_REPORTS).upload(
        path=filename,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )
    return client.storage.from_(BUCKET_REPORTS).get_public_url(filename)


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)
