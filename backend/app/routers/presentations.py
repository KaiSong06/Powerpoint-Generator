from fastapi import APIRouter, HTTPException, Query

from ..database import execute, fetch_all, fetch_one, get_pool
from ..schemas.consultant import ConsultantOut
from ..schemas.presentation import PresentationCreate, PresentationDetail, PresentationOut
from ..schemas.product import ProductOut

router = APIRouter(prefix="/api/presentations", tags=["presentations"])


@router.get("", response_model=list[PresentationOut])
async def list_presentations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * per_page
    rows = await fetch_all(
        """SELECT id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at
           FROM presentations
           ORDER BY generated_at DESC NULLS LAST
           LIMIT $1 OFFSET $2""",
        per_page,
        offset,
    )
    return [dict(r) for r in rows]


@router.get("/{presentation_id}", response_model=PresentationDetail)
async def get_presentation(presentation_id: int):
    row = await fetch_one(
        """SELECT id, file_url, file_name, client_name, office_address, product_count,
                  sq_ft, generated_at, suite_number, floor_plan_url, consultant_id
           FROM presentations WHERE id = $1""",
        presentation_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Presentation not found")

    data = dict(row)
    consultant_id = data.pop("consultant_id", None)

    # Fetch consultant
    consultant = None
    if consultant_id:
        c_row = await fetch_one(
            "SELECT id, name, email, phone FROM consultants WHERE id = $1",
            consultant_id,
        )
        if c_row:
            consultant = ConsultantOut(**dict(c_row))

    # Fetch products
    product_rows = await fetch_all(
        """SELECT p.product_code, p.name, p.specifications, p.image_url, p.price, p.markup_percent, p.category
           FROM presentation_products pp
           JOIN products p ON pp.product_code = p.product_code
           WHERE pp.presentation_id = $1
           ORDER BY p.category, p.name""",
        presentation_id,
    )
    products = [ProductOut(**dict(r)) for r in product_rows]

    return PresentationDetail(**data, consultant=consultant, products=products)


@router.post("/generate", response_model=PresentationOut, status_code=201)
async def generate_presentation(body: PresentationCreate):
    """Create a presentation record with its product associations.

    PPTX generation will be added in Phase 3.
    """
    async with get_pool().acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO presentations (client_name, office_address, suite_number, sq_ft, consultant_id, product_count)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at""",
                body.client_name,
                body.office_address,
                body.suite_number,
                body.sq_ft,
                body.consultant_id,
                len(body.products),
            )

            for item in body.products:
                await conn.execute(
                    """INSERT INTO presentation_products (presentation_id, product_code, quantity)
                       VALUES ($1, $2, $3)""",
                    row["id"],
                    item.product_code,
                    item.quantity,
                )

    return dict(row)


@router.delete("/{presentation_id}", status_code=204)
async def delete_presentation(presentation_id: int):
    result = await execute(
        "DELETE FROM presentations WHERE id = $1",
        presentation_id,
    )
    # asyncpg returns "DELETE N" where N is rows affected
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Presentation not found")
