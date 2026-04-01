from fastapi import APIRouter, Depends, HTTPException

from ..database import fetch_one
from ..middleware.auth import AuthUser, get_current_user
from ..schemas.profile import ProfileCreate, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
async def get_profile(user: AuthUser = Depends(get_current_user)):
    row = await fetch_one(
        "SELECT user_id, email, name, phone FROM user_profiles WHERE user_id = $1",
        user.id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = dict(row)
    data["user_id"] = str(data["user_id"])
    return data


@router.post("", response_model=ProfileOut, status_code=201)
async def create_profile(body: ProfileCreate, user: AuthUser = Depends(get_current_user)):
    existing = await fetch_one(
        "SELECT user_id FROM user_profiles WHERE user_id = $1",
        user.id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists")

    row = await fetch_one(
        """INSERT INTO user_profiles (user_id, email, name, phone)
           VALUES ($1, $2, $3, $4)
           RETURNING user_id, email, name, phone""",
        user.id,
        user.email,
        body.name,
        body.phone,
    )
    data = dict(row)
    data["user_id"] = str(data["user_id"])
    return data


@router.put("", response_model=ProfileOut)
async def update_profile(body: ProfileCreate, user: AuthUser = Depends(get_current_user)):
    row = await fetch_one(
        """UPDATE user_profiles SET name = $1, phone = $2, updated_at = NOW()
           WHERE user_id = $3
           RETURNING user_id, email, name, phone""",
        body.name,
        body.phone,
        user.id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = dict(row)
    data["user_id"] = str(data["user_id"])
    return data
