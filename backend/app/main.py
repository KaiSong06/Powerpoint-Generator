from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import close_pool, create_pool


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

# Routers will be included in Phase 2:
# from .routers import consultants, products, presentations
# app.include_router(consultants.router)
# app.include_router(products.router)
# app.include_router(presentations.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
