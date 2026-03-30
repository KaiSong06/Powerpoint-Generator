from pydantic import BaseModel


class ConsultantOut(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
