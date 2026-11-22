from urllib.parse import urlparse
import httpx
from app.config import get_settings
from app.platforms.base import BasePlatform
from app.schemas import PlatformResult


class MastodonPlatform(BasePlatform):
    name = "Mastodon"

    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        settings = get_settings()
        instance = settings.mastodon_instance_url.strip().rstrip("/")
        token = settings.mastodon_access_token.strip()
        if not instance or not token:
            return self._failed("Authentication failed: Mastodon credentials not configured")

        parsed = urlparse(instance)
        if parsed.scheme != "https":
            return self._failed("MASTODON_INSTANCE_URL must use https://")

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                res = await client.post(
                    f"{parsed.scheme}://{parsed.netloc}/api/v1/statuses",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"status": message, "visibility": "public"},
                )
                data = res.json()
                if res.status_code >= 400 or not data.get("url"):
                    return self._failed(data.get("error", f"Mastodon returned HTTP {res.status_code}"))
                return self._success(data["url"], public_access=True)
        except Exception as exc:  # noqa: BLE001
            return self._failed(str(exc))
