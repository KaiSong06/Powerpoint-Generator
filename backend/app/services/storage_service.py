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
    """Upload a file to Supabase Storage and return its public URL."""
    client = _get_client()
    client.storage.from_(bucket).upload(
        file_path,
        file_bytes,
        {"content-type": content_type},
    )
    return client.storage.from_(bucket).get_public_url(file_path)
