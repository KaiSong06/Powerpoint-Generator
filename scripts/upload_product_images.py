"""
Upload product images to Supabase Storage and update DB records.

Usage:
    python scripts/upload_product_images.py [--images-dir PATH]

Requires backend/.env with SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_URL.
"""

import mimetypes
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from supabase import create_client

# Load env from backend/.env
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
load_dotenv(BACKEND_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
SUPABASE_DB_URL = os.environ["SUPABASE_DB_URL"]
BUCKET = "product-images"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def get_product_codes_from_db(conn):
    """Return set of all product_code values in the products table."""
    with conn.cursor() as cur:
        cur.execute("SELECT product_code FROM products")
        return {row[0] for row in cur.fetchall()}


def ensure_bucket(supabase):
    """Create the public bucket if it doesn't exist."""
    try:
        supabase.storage.get_bucket(BUCKET)
        print(f"Bucket '{BUCKET}' already exists.")
    except Exception:
        supabase.storage.create_bucket(BUCKET, options={"public": True})
        print(f"Created public bucket '{BUCKET}'.")


def collect_images(images_dir: Path) -> dict[str, Path]:
    """Walk category folders and return {product_code: file_path}."""
    images = {}
    for category_dir in sorted(images_dir.iterdir()):
        if not category_dir.is_dir():
            continue
        for img_file in sorted(category_dir.iterdir()):
            if img_file.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            # Strip extension to get product code; also strip trailing dots
            code = img_file.stem.rstrip(".")
            if code in images:
                print(f"  WARN: Duplicate code '{code}' — keeping first occurrence, skipping {img_file}")
                continue
            images[code] = img_file
    return images


def upload_and_update(images_dir: Path):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    conn = psycopg2.connect(SUPABASE_DB_URL)

    try:
        ensure_bucket(supabase)

        db_codes = get_product_codes_from_db(conn)
        images = collect_images(images_dir)

        print(f"\nFound {len(images)} images, {len(db_codes)} products in DB.\n")

        uploaded = 0
        skipped = 0

        for code, file_path in sorted(images.items()):
            ext = file_path.suffix.lower()
            storage_path = f"{code}{ext}"
            content_type = mimetypes.guess_type(file_path.name)[0] or "image/jpeg"

            if code not in db_codes:
                print(f"  SKIP: '{code}' — no matching product in DB")
                skipped += 1
                continue

            # Upload to storage
            file_bytes = file_path.read_bytes()
            try:
                supabase.storage.from_(BUCKET).upload(
                    storage_path, file_bytes, {"content-type": content_type}
                )
            except Exception as e:
                if "Duplicate" in str(e) or "already exists" in str(e):
                    # Remove and re-upload
                    supabase.storage.from_(BUCKET).remove([storage_path])
                    supabase.storage.from_(BUCKET).upload(
                        storage_path, file_bytes, {"content-type": content_type}
                    )
                else:
                    print(f"  ERROR uploading '{code}': {e}")
                    skipped += 1
                    continue

            # Build public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"

            # Update DB
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE products SET image_url = %s WHERE product_code = %s",
                    (public_url, code),
                )
            conn.commit()

            print(f"  OK: {code} -> {storage_path}")
            uploaded += 1

        # Report products with no image
        missing = db_codes - set(images.keys())
        if missing:
            print(f"\nProducts with no image ({len(missing)}):")
            for code in sorted(missing):
                print(f"  - {code}")

        print(f"\nDone: {uploaded} uploaded, {skipped} skipped.")

    finally:
        conn.close()


if __name__ == "__main__":
    default_dir = Path.home() / "Downloads" / "Product_images"
    images_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else default_dir

    if not images_dir.is_dir():
        print(f"Error: '{images_dir}' is not a directory.")
        sys.exit(1)

    print(f"Images directory: {images_dir}")
    upload_and_update(images_dir)
