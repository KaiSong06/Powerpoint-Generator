from pydantic import BaseModel


class ProfileCreate(BaseModel):
    name: str
    phone: str | None = None


class ProfileOut(BaseModel):
    user_id: str
    email: str
    name: str
    phone: str | None = None
