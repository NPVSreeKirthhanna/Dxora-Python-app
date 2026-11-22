import httpx
from app.config import get_settings
from app.platforms.base import BasePlatform
from app.schemas import PlatformResult


class TelegraphPlatform(BasePlatform):
    name = "Telegraph (telegra.ph)"

    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        settings = get_settings()
        token = settings.telegraph_access_token.strip()
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                if not token:
                    acct = await client.post(
                        "https://api.telegra.ph/createAccount",
                        json={"short_name": "LinkScopeDispatch", "author_name": "Automated Publisher"},
                    )
                    acct_data = acct.json()
                    if not acct_data.get("ok"):
                        return self._failed(acct_data.get("error", f"HTTP {acct.status_code}"))
                    token = acct_data["result"]["access_token"]

                title = (message.replace(cta_url, "").strip() or "Business Update")[:80]
                res = await client.post(
                    "https://api.telegra.ph/createPage",
                    json={
                        "access_token": token,
                        "title": title,
                        "author_name": "Automated Publisher",
                        "content": [
                            {"tag": "p", "children": [message]},
                            {
                                "tag": "p",
                                "children": ["Link: ", {"tag": "a", "attrs": {"href": cta_url}, "children": [cta_url]}],
                            },
                        ],
                    },
                )
                data = res.json()
                if not data.get("ok") or not data.get("result", {}).get("url"):
                    return self._failed(data.get("error", f"HTTP {res.status_code}"))
                return self._success(data["result"]["url"], public_access=True)
        except Exception as exc:  # noqa: BLE001
            return self._failed(str(exc))
