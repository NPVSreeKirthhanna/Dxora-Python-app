from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    telegraph_access_token: str = ""
    devto_api_key: str = ""
    mastodon_instance_url: str = ""
    mastodon_access_token: str = ""
    bluesky_handle: str = ""
    bluesky_app_password: str = ""
    discord_webhook_url: str = ""
    request_timeout_seconds: float = 10.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
