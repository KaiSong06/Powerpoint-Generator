import asyncio
import json
import os
import tempfile
import uuid
from decimal import Decimal

from ..config import get_settings
from ..database import fetch_all, fetch_one, execute
from .storage_service import upload_file


def _decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


async def generate_presentation(presentation_id: int) -> str:
    """Generate a PPTX file for a presentation and upload it to storage.

    Returns the public URL of the uploaded file.
    """
    settings = get_settings()

    # 1. Fetch presentation record
    pres = await fetch_one(
        """SELECT id, client_name, office_address, suite_number, sq_ft,
                  floor_plan_url, consultant_id
           FROM presentations WHERE id = $1""",
        presentation_id,
    )
    if not pres:
        raise ValueError(f"Presentation {presentation_id} not found")

    # 2. Fetch consultant
    consultant = None
    if pres["consultant_id"]:
        c_row = await fetch_one(
            "SELECT name, email, phone FROM consultants WHERE id = $1",
            pres["consultant_id"],
        )
        if c_row:
            consultant = dict(c_row)

    # 3. Fetch products with quantities
    product_rows = await fetch_all(
        """SELECT p.product_code, p.name, p.specifications, p.image_url,
                  p.price, p.markup_percent, p.category, pp.quantity
           FROM presentation_products pp
           JOIN products p ON pp.product_code = p.product_code
           WHERE pp.presentation_id = $1
           ORDER BY p.category, p.name""",
        presentation_id,
    )

    # 4. Compute display prices and totals
    products_payload = []
    total_cost = Decimal("0")
    for row in product_rows:
        markup = row["markup_percent"] or Decimal("0")
        display_price = row["price"] * (1 + markup / 100)
        extended = display_price * row["quantity"]
        total_cost += extended
        products_payload.append({
            "productCode": row["product_code"],
            "name": row["name"],
            "specifications": row["specifications"],
            "imageUrl": row["image_url"],
            "price": display_price,
            "quantity": row["quantity"],
            "extended": extended,
            "category": row["category"],
        })

    sq_ft = pres["sq_ft"] or 1
    cost_per_sq_ft = total_cost / sq_ft

    # 5. Build payload
    with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
        output_path = tmp.name

    payload = {
        "outputPath": output_path,
        "clientName": pres["client_name"],
        "officeAddress": pres["office_address"],
        "suiteNumber": pres["suite_number"] or "",
        "sqFt": sq_ft,
        "floorPlanUrl": pres["floor_plan_url"],
        "consultant": consultant or {"name": "", "email": "", "phone": ""},
        "products": products_payload,
        "totalCost": total_cost,
        "costPerSqFt": cost_per_sq_ft,
    }

    # 6. Call Node.js engine
    engine_path = os.path.join(settings.pptx_engine_path, "src", "index.js")
    proc = await asyncio.create_subprocess_exec(
        "node", engine_path,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate(
        json.dumps(payload, default=_decimal_default).encode()
    )

    if proc.returncode != 0:
        # Clean up temp file on failure
        if os.path.exists(output_path):
            os.unlink(output_path)
        raise RuntimeError(
            f"PPTX engine failed (exit {proc.returncode}): {stderr.decode()}"
        )

    # 7. Read generated file and upload to storage
    try:
        with open(output_path, "rb") as f:
            file_bytes = f.read()

        file_name = f"{pres['client_name'].replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pptx"
        storage_path = f"generated/{presentation_id}/{file_name}"

        file_url = await upload_file(
            settings.storage_bucket,
            storage_path,
            file_bytes,
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )

        # 8. Update presentation record
        await execute(
            "UPDATE presentations SET file_url = $1, file_name = $2 WHERE id = $3",
            file_url,
            file_name,
            presentation_id,
        )

        return file_url
    finally:
        # Clean up temp file
        if os.path.exists(output_path):
            os.unlink(output_path)
