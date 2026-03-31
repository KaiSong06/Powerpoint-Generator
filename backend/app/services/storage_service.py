from supabase import create_client

from ..config import get_settings


def _get_client():
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


async def upload_file(
    bucket: str,
    file_path: str,
    file_bytes: bytes,
    content_type: str,
) -> str:
    """Upload a file to Supabase Storage and return its storage path."""
    client = _get_client()
    client.storage.from_(bucket).upload(
        file_path,
        file_bytes,
        {"content-type": content_type},
    )
    return file_path


async def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Generate a time-limited signed URL for a private storage object."""
    client = _get_client()
    response = client.storage.from_(bucket).create_signed_url(path, expires_in)
    return response["signedURL"]
