from datetime import datetime, timezone
import httpx
from app.config import get_settings
from app.platforms.base import BasePlatform
from app.schemas import PlatformResult


class BlueskyPlatform(BasePlatform):
    name = "Bluesky"

    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        settings = get_settings()
        handle = settings.bluesky_handle.strip()
        password = settings.bluesky_app_password.strip()
        if not handle or not password:
            return self._failed("Authentication failed: Bluesky credentials not configured")

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                auth_res = await client.post(
                    "https://bsky.social/xrpc/com.atproto.server.createSession",
                    json={"identifier": handle, "password": password},
                )
                auth_data = auth_res.json()
                if auth_res.status_code >= 400 or not auth_data.get("accessJwt"):
                    return self._failed(auth_data.get("message", "Bluesky auth failed"))

                byte_start = len(message[: message.index(cta_url)].encode("utf-8"))
                byte_end = byte_start + len(cta_url.encode("utf-8"))
                post_res = await client.post(
                    "https://bsky.social/xrpc/com.atproto.repo.createRecord",
                    headers={"Authorization": f"Bearer {auth_data['accessJwt']}"},
                    json={
                        "repo": auth_data["did"],
                        "collection": "app.bsky.feed.post",
                        "record": {
                            "$type": "app.bsky.feed.post",
                            "text": message,
                            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                            "facets": [
                                {
                                    "index": {"byteStart": byte_start, "byteEnd": byte_end},
                                    "features": [{"$type": "app.bsky.richtext.facet#link", "uri": cta_url}],
                                }
                            ],
                        },
                    },
                )
                post_data = post_res.json()
                if post_res.status_code >= 400 or not post_data.get("uri"):
                    return self._failed(post_data.get("message", "Bluesky post failed"))
                rkey = post_data["uri"].split("/")[-1]
                return self._success(f"https://bsky.app/profile/{handle}/post/{rkey}", public_access=True)
        except Exception as exc:  # noqa: BLE001
            return self._failed(str(exc))
