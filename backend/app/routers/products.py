from fastapi import APIRouter, HTTPException, Query

from ..database import fetch_all, fetch_one
from ..schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/categories", response_model=list[str])
async def list_categories():
    rows = await fetch_all(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category"
    )
    return [r["category"] for r in rows]


@router.get("", response_model=list[ProductOut])
async def list_products(
    category: str | None = Query(None),
    search: str | None = Query(None),
):
    query = "SELECT product_code, name, specifications, image_url, price, markup_percent, category FROM products WHERE 1=1"
    args: list = []
    idx = 1

    if category:
        query += f" AND category = ${idx}"
        args.append(category)
        idx += 1

    if search:
        query += f" AND (name ILIKE ${idx} OR specifications ILIKE ${idx})"
        args.append(f"%{search}%")
        idx += 1

    query += " ORDER BY category, name"
    rows = await fetch_all(query, *args)
    return [dict(r) for r in rows]


@router.get("/{product_code}", response_model=ProductOut)
async def get_product(product_code: str):
    row = await fetch_one(
        "SELECT product_code, name, specifications, image_url, price, markup_percent, category FROM products WHERE product_code = $1",
        product_code,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(body: ProductCreate):
    row = await fetch_one(
        """INSERT INTO products (product_code, name, specifications, image_url, price, markup_percent, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING product_code, name, specifications, image_url, price, markup_percent, category""",
        body.product_code,
        body.name,
        body.specifications,
        body.image_url,
        body.price,
        body.markup_percent,
        body.category,
    )
    return dict(row)


@router.put("/{product_code}", response_model=ProductOut)
async def update_product(product_code: str, body: ProductCreate):
    row = await fetch_one(
        """UPDATE products SET name = $1, specifications = $2, image_url = $3, price = $4, markup_percent = $5, category = $6
           WHERE product_code = $7
           RETURNING product_code, name, specifications, image_url, price, markup_percent, category""",
        body.name,
        body.specifications,
        body.image_url,
        body.price,
        body.markup_percent,
        body.category,
        product_code,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)
