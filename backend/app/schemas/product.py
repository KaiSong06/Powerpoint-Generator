from decimal import Decimal

from pydantic import BaseModel


class ProductCreate(BaseModel):
    product_code: str
    name: str
    specifications: str | None = None
    image_url: str | None = None
    price: Decimal
    markup_percent: Decimal | None = None
    category: str | None = None


class ProductOut(BaseModel):
    product_code: str
    name: str
    specifications: str | None = None
    image_url: str | None = None
    price: Decimal
    markup_percent: Decimal | None = None
    category: str | None = None


class ProductFilter(BaseModel):
    category: str | None = None
    search: str | None = None
