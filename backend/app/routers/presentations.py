import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from ..config import get_settings
from ..database import execute, fetch_all, fetch_one, get_pool
from ..middleware.auth import AuthUser, get_current_user
from ..schemas.consultant import ConsultantOut
from ..schemas.presentation import (
    AutoSelectRequest,
    GenerateFromBriefRequest,
    PresentationDetail,
    PresentationOut,
)
from ..services.space_parser import parse_space_brief
from ..schemas.product import ProductOut
from ..services.pptx_service import generate_presentation
from ..services.product_matcher import match_products
from ..services.storage_service import get_signed_url, upload_file

router = APIRouter(prefix="/api/presentations", tags=["presentations"])


@router.get("", response_model=list[PresentationOut])
async def list_presentations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _user: AuthUser = Depends(get_current_user),
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


@router.post("/auto-select", response_model=PresentationOut, status_code=201)
async def auto_select_endpoint(
    body: AutoSelectRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Auto-select products based on a space breakdown, then generate a PPTX."""
    # Run the product matcher
    spaces = [
        {"space_type": s.space_type.value, "count": s.count, "capacity": s.capacity}
        for s in body.spaces
    ]
    selections = await match_products(spaces)

    if not selections:
        raise HTTPException(
            status_code=400,
            detail="No products matched the given space breakdown",
        )

    # Resolve consultant
    consultant_id = body.consultant_id
    if consultant_id is None:
        c_row = await fetch_one(
            "SELECT id FROM consultants WHERE email = $1",
            user.email,
        )
        if not c_row:
            raise HTTPException(
                status_code=400,
                detail="No consultant_id provided and no consultant matches your email",
            )
        consultant_id = c_row["id"]

    # Create presentation + product associations in a transaction
    product_items = [
        {"product_code": s["product_code"], "quantity": s["quantity"]}
        for s in selections
    ]

    async with get_pool().acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO presentations
                   (client_name, office_address, suite_number, sq_ft, consultant_id, product_count)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at""",
                body.client_name,
                body.office_address,
                body.suite_number,
                body.sq_ft,
                consultant_id,
                len(product_items),
            )

            for item in product_items:
                await conn.execute(
                    """INSERT INTO presentation_products (presentation_id, product_code, quantity)
                       VALUES ($1, $2, $3)""",
                    row["id"],
                    item["product_code"],
                    item["quantity"],
                )

    # Generate PPTX and upload
    presentation_id = row["id"]
    try:
        await generate_presentation(presentation_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Re-fetch the updated record
    updated = await fetch_one(
        """SELECT id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at
           FROM presentations WHERE id = $1""",
        presentation_id,
    )
    return dict(updated)


@router.post("/generate-from-brief", response_model=PresentationOut, status_code=201)
async def generate_from_brief_endpoint(
    body: GenerateFromBriefRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Parse a natural language space brief with AI, auto-select products, and generate a PPTX."""
    # Step 1: AI-parse the brief into structured spaces
    try:
        space_requests = await parse_space_brief(body.brief)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Step 2: Run the product matcher
    spaces = [
        {"space_type": s.space_type.value, "count": s.count, "capacity": s.capacity}
        for s in space_requests
    ]
    selections = await match_products(spaces)

    if not selections:
        raise HTTPException(
            status_code=400,
            detail="No products matched the parsed space breakdown",
        )

    # Step 3: Resolve consultant
    consultant_id = body.consultant_id
    if consultant_id is None:
        c_row = await fetch_one(
            "SELECT id FROM consultants WHERE email = $1",
            user.email,
        )
        if not c_row:
            raise HTTPException(
                status_code=400,
                detail="No consultant_id provided and no consultant matches your email",
            )
        consultant_id = c_row["id"]

    # Step 4: Create presentation + product associations in a transaction
    product_items = [
        {"product_code": s["product_code"], "quantity": s["quantity"]}
        for s in selections
    ]

    async with get_pool().acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO presentations
                   (client_name, office_address, suite_number, sq_ft, consultant_id, product_count)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at""",
                body.client_name,
                body.office_address,
                body.suite_number,
                body.sq_ft,
                consultant_id,
                len(product_items),
            )

            for item in product_items:
                await conn.execute(
                    """INSERT INTO presentation_products (presentation_id, product_code, quantity)
                       VALUES ($1, $2, $3)""",
                    row["id"],
                    item["product_code"],
                    item["quantity"],
                )

    # Step 5: Generate PPTX and upload
    presentation_id = row["id"]
    try:
        await generate_presentation(presentation_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Re-fetch the updated record
    updated = await fetch_one(
        """SELECT id, file_url, file_name, client_name, office_address, product_count, sq_ft, generated_at
           FROM presentations WHERE id = $1""",
        presentation_id,
    )
    return dict(updated)


@router.get("/{presentation_id}", response_model=PresentationDetail)
async def get_presentation(presentation_id: int, _user: AuthUser = Depends(get_current_user)):
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
    consultant_id: int | None = Form(None),
    products: str = Form(..., description='JSON array: [{"product_code": "...", "quantity": 1}]'),
    floor_plan: UploadFile | None = File(None),
    user: AuthUser = Depends(get_current_user),
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

    # Auto-detect consultant from auth user email if not explicitly provided
    if consultant_id is None:
        c_row = await fetch_one(
            "SELECT id FROM consultants WHERE email = $1",
            user.email,
        )
        if not c_row:
            raise HTTPException(
                status_code=400,
                detail="No consultant_id provided and no consultant matches your email",
            )
        consultant_id = c_row["id"]

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


@router.get("/{presentation_id}/download")
async def download_presentation(
    presentation_id: int,
    _user: AuthUser = Depends(get_current_user),
):
    """Generate a time-limited signed URL for downloading the PPTX file."""
    row = await fetch_one(
        "SELECT file_url FROM presentations WHERE id = $1",
        presentation_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Presentation not found")

    file_path = row["file_url"]
    if not file_path:
        raise HTTPException(status_code=404, detail="No file generated for this presentation")

    settings = get_settings()
    signed_url = await get_signed_url(settings.storage_bucket, file_path, expires_in=3600)
    return {"download_url": signed_url}


@router.delete("/{presentation_id}", status_code=204)
async def delete_presentation(presentation_id: int, _user: AuthUser = Depends(get_current_user)):
    result = await execute(
        "DELETE FROM presentations WHERE id = $1",
        presentation_id,
    )
    # asyncpg returns "DELETE N" where N is rows affected
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Presentation not found")
