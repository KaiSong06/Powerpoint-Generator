from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    supabase_url: str
    supabase_key: str
    supabase_db_url: str
    gemini_api_key: str = ""
    pptx_engine_path: str = "../pptx-engine"
    storage_bucket: str = "presentations"
    frontend_url: str = "http://localhost:3000"
    extra_cors_origins: str = ""
    gemini_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
