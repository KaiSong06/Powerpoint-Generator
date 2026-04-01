from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import close_pool, create_pool
from .routers import presentations, products, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await create_pool(settings.supabase_db_url)
    yield
    await close_pool()


app = FastAPI(title="Envirotech PPTX API", lifespan=lifespan)

settings = get_settings()
cors_origins = [settings.frontend_url]
if settings.extra_cors_origins:
    cors_origins.extend(
        origin.strip() for origin in settings.extra_cors_origins.split(",") if origin.strip()
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(presentations.router)
app.include_router(profile.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
