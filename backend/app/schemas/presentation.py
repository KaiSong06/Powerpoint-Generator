from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from .consultant import ConsultantOut
from .product import ProductOut


class ProductItem(BaseModel):
    product_code: str
    quantity: int


class SpaceType(str, Enum):
    open_workstation = "open_workstation"
    private_office = "private_office"
    conference_room = "conference_room"
    huddle_room = "huddle_room"
    phone_booth = "phone_booth"
    reception = "reception"
    lounge = "lounge"
    break_room = "break_room"
    training_room = "training_room"
    executive_office = "executive_office"


class SpaceRequest(BaseModel):
    space_type: SpaceType
    count: int = Field(..., ge=1)
    capacity: int | None = Field(None, ge=1)


class AutoSelectRequest(BaseModel):
    client_name: str
    office_address: str
    suite_number: str | None = None
    sq_ft: int = Field(..., ge=1)
    consultant_id: int | None = None
    spaces: list[SpaceRequest] = Field(..., min_length=1)


class GenerateFromBriefRequest(BaseModel):
    client_name: str
    office_address: str
    suite_number: str | None = None
    sq_ft: int = Field(..., ge=1)
    consultant_id: int | None = None
    brief: str = Field(..., min_length=1, max_length=5000)


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
