import httpx
from app.config import get_settings
from app.platforms.base import BasePlatform
from app.schemas import PlatformResult


class DevToPlatform(BasePlatform):
    name = "Dev.to"

    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        settings = get_settings()
        api_key = settings.devto_api_key.strip()
        if not api_key:
            return self._failed("Authentication failed: DEVTO_API_KEY is not configured")

        headline = (message.replace(cta_url, "").strip() or "Platform Announcement")[:120]
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                res = await client.post(
                    "https://dev.to/api/articles",
                    headers={"api-key": api_key, "Content-Type": "application/json"},
                    json={
                        "article": {
                            "title": headline,
                            "published": True,
                            "body_markdown": f"{message}\n\nLearn more: [{cta_url}]({cta_url})",
                            "tags": ["announcement", "web"],
                        }
                    },
                )
                data = res.json()
                if res.status_code >= 400 or not data.get("url"):
                    return self._failed(data.get("error", f"Dev.to returned HTTP {res.status_code}"))
                return self._success(data["url"], public_access=True)
        except Exception as exc:  # noqa: BLE001
            return self._failed(str(exc))
