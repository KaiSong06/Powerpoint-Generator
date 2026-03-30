from pydantic import BaseModel


class ConsultantCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None


class ConsultantOut(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
