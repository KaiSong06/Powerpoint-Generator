import json
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from ..config import get_settings
from ..database import execute, fetch_all, fetch_one, get_pool
from ..schemas.consultant import ConsultantOut
from ..schemas.presentation import PresentationDetail, PresentationOut
from ..schemas.product import ProductOut
from ..services.pptx_service import generate_presentation
from ..services.storage_service import upload_file

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
async def generate_presentation_endpoint(
    client_name: str = Form(...),
    office_address: str = Form(...),
    suite_number: str = Form(None),
    sq_ft: int = Form(...),
    consultant_id: int = Form(...),
    products: str = Form(..., description='JSON array: [{"product_code": "...", "quantity": 1}]'),
    floor_plan: UploadFile | None = File(None),
):
    """Create a presentation, generate the PPTX, and upload to storage."""
    # Parse products JSON
    try:
        product_items = json.loads(products)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in products field")

    if not isinstance(product_items, list) or len(product_items) == 0:
        raise HTTPException(status_code=400, detail="Products must be a non-empty array")

    # Validate all product codes exist
    codes = [item["product_code"] for item in product_items]
    placeholders = ", ".join(f"${i+1}" for i in range(len(codes)))
    existing = await fetch_all(
        f"SELECT product_code FROM products WHERE product_code IN ({placeholders})",
        *codes,
    )
    existing_codes = {r["product_code"] for r in existing}
    missing = [c for c in codes if c not in existing_codes]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Product codes not found: {', '.join(missing)}",
        )

    # Upload floor plan if provided
    floor_plan_url = None
    if floor_plan and floor_plan.filename:
        settings = get_settings()
        file_bytes = await floor_plan.read()
        ext = floor_plan.filename.rsplit(".", 1)[-1] if "." in floor_plan.filename else "png"
        storage_path = f"floor_plans/{uuid.uuid4().hex}.{ext}"
        try:
            floor_plan_url = await upload_file(
                settings.storage_bucket,
                storage_path,
                file_bytes,
                floor_plan.content_type or "image/png",
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Floor plan upload failed: {e}")

    # Create presentation + product associations in a transaction
    async with get_pool().acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO presentations
                   (client_name, office_address, suite_number, sq_ft, consultant_id, product_count, floor_plan_url)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at""",
                client_name,
                office_address,
                suite_number,
                sq_ft,
                consultant_id,
                len(product_items),
                floor_plan_url,
            )

            for item in product_items:
                await conn.execute(
                    """INSERT INTO presentation_products (presentation_id, product_code, quantity)
                       VALUES ($1, $2, $3)""",
                    row["id"],
                    item["product_code"],
                    item.get("quantity", 1),
                )

    # Generate PPTX and upload
    presentation_id = row["id"]
    try:
        file_url = await generate_presentation(presentation_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Re-fetch the updated record
    updated = await fetch_one(
        """SELECT id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at
           FROM presentations WHERE id = $1""",
        presentation_id,
    )
    return dict(updated)


@router.delete("/{presentation_id}", status_code=204)
async def delete_presentation(presentation_id: int):
    result = await execute(
        "DELETE FROM presentations WHERE id = $1",
        presentation_id,
    )
    # asyncpg returns "DELETE N" where N is rows affected
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Presentation not found")
