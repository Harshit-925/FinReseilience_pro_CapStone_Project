"""
Application configuration — env-driven, cached singleton.
Never hardcode secrets.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All configuration read from environment variables or .env file."""

    # Application
    environment: str = "development"
    use_ai: bool = True

    # Gemini & OpenRouter
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # PocketBase
    pocketbase_url: str = "http://localhost:8090"

    # Rate limiting
    rate_limit_storage_uri: str = "memory://"

    class Config:
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — only reads env once."""
    return Settings()
