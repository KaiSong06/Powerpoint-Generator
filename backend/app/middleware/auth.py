from dataclasses import dataclass

from fastapi import Header, HTTPException
from supabase import create_client

from ..config import get_settings


@dataclass
class AuthUser:
    id: str
    email: str


async def get_current_user(authorization: str = Header(...)) -> AuthUser:
    """FastAPI dependency that verifies a Supabase Bearer token.

    Returns an AuthUser with the user's id and email.
    Raises 401 if the token is missing, malformed, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[len("Bearer "):]
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_key)

    try:
        response = client.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return AuthUser(id=user.id, email=user.email or "")
