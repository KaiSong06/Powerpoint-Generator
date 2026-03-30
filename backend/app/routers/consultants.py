from fastapi import APIRouter, HTTPException

from ..database import execute, fetch_all, fetch_one
from ..schemas.consultant import ConsultantCreate, ConsultantOut

router = APIRouter(prefix="/api/consultants", tags=["consultants"])


@router.get("", response_model=list[ConsultantOut])
async def list_consultants():
    rows = await fetch_all("SELECT id, name, email, phone FROM consultants ORDER BY name")
    return [dict(r) for r in rows]


@router.get("/{consultant_id}", response_model=ConsultantOut)
async def get_consultant(consultant_id: int):
    row = await fetch_one(
        "SELECT id, name, email, phone FROM consultants WHERE id = $1",
        consultant_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Consultant not found")
    return dict(row)


@router.post("", response_model=ConsultantOut, status_code=201)
async def create_consultant(body: ConsultantCreate):
    row = await fetch_one(
        "INSERT INTO consultants (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone",
        body.name,
        body.email,
        body.phone,
    )
    return dict(row)


@router.put("/{consultant_id}", response_model=ConsultantOut)
async def update_consultant(consultant_id: int, body: ConsultantCreate):
    row = await fetch_one(
        "UPDATE consultants SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone",
        body.name,
        body.email,
        body.phone,
        consultant_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Consultant not found")
    return dict(row)
