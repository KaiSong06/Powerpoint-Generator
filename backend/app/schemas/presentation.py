from datetime import datetime

from pydantic import BaseModel

from .consultant import ConsultantOut
from .product import ProductOut


class ProductItem(BaseModel):
    product_code: str
    quantity: int


class PresentationCreate(BaseModel):
    client_name: str
    office_address: str
    suite_number: str | None = None
    sq_ft: int
    consultant_id: int
    products: list[ProductItem]


class PresentationOut(BaseModel):
    id: int
    file_url: str | None = None
    file_name: str | None = None
    client_name: str
    office_address: str
    product_count: int | None = None
    sq_ft: int
    generated_at: datetime | None = None


class PresentationDetail(PresentationOut):
    suite_number: str | None = None
    floor_plan_url: str | None = None
    products: list[ProductOut] = []
    consultant: ConsultantOut | None = None
