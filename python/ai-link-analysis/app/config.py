from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    primary_model: str = "gemini-2.5-flash"
    fallback_model: str = "gemini-2.5-flash-lite"
    request_timeout_seconds: float = 12.0
    max_html_bytes: int = 2 * 1024 * 1024
    max_clean_chars: int = 7500

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
