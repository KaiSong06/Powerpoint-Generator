import asyncio
from functools import lru_cache

from supabase import create_client

from ..config import get_settings


@lru_cache(maxsize=1)
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

    def _upload():
        client.storage.from_(bucket).upload(
            file_path,
            file_bytes,
            {"content-type": content_type},
        )

    await asyncio.wait_for(
        asyncio.get_event_loop().run_in_executor(None, _upload),
        timeout=60,
    )
    return file_path


async def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Generate a time-limited signed URL for a private storage object."""
    client = _get_client()

    def _sign():
        return client.storage.from_(bucket).create_signed_url(path, expires_in)

    response = await asyncio.wait_for(
        asyncio.get_event_loop().run_in_executor(None, _sign),
        timeout=30,
    )
    return response["signedURL"]
