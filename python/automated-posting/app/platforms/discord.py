from urllib.parse import urlparse
import httpx
from app.config import get_settings
from app.platforms.base import BasePlatform
from app.schemas import PlatformResult


class DiscordPlatform(BasePlatform):
    name = "Discord"

    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        settings = get_settings()
        webhook = settings.discord_webhook_url.strip()
        if not webhook:
            return self._failed("Authentication failed: DISCORD_WEBHOOK_URL is not configured")

        parsed = urlparse(webhook)
        if parsed.scheme != "https" or parsed.hostname not in {"discord.com", "discordapp.com"}:
            return self._failed("Invalid DISCORD_WEBHOOK_URL host")

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                res = await client.post(f"{webhook.split('?')[0]}?wait=true", json={"content": message})
                data = res.json() if res.content else {}
                if res.status_code >= 400:
                    return self._failed(data.get("message", f"Discord returned HTTP {res.status_code}"))
                url = (
                    f"https://discord.com/channels/@me/{data['channel_id']}/{data['id']}"
                    if data.get("channel_id") and data.get("id")
                    else webhook.split("?")[0]
                )
                return self._success(url, public_access=False)
        except Exception as exc:  # noqa: BLE001
            return self._failed(str(exc))
