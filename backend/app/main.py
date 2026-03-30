import asyncio
import json
import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import close_pool, create_pool
from .routers import consultants, presentations, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await create_pool(settings.supabase_db_url)
    yield
    await close_pool()


app = FastAPI(title="Envirotech PPTX API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consultants.router)
app.include_router(products.router)
app.include_router(presentations.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/test-pptx")
async def test_pptx():
    """Test that the pptx-engine subprocess works."""
    settings = get_settings()
    engine_path = os.path.join(settings.pptx_engine_path, "src", "index.js")

    with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
        output_path = tmp.name

    payload = json.dumps({
        "outputPath": output_path,
        "clientName": "Test Client",
        "officeAddress": "123 Test St",
        "suiteNumber": "Suite 100",
        "sqFt": 5000,
        "consultant": {"name": "Test", "email": "test@test.com", "phone": "555-0000"},
        "products": [],
        "totalCost": 0,
        "costPerSqFt": 0,
    })

    proc = await asyncio.create_subprocess_exec(
        "node", engine_path,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate(payload.encode())

    # Clean up temp file
    if os.path.exists(output_path):
        os.unlink(output_path)

    return {
        "exit_code": proc.returncode,
        "stderr": stderr.decode(),
        "success": proc.returncode == 0,
    }
