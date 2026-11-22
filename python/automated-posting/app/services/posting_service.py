import asyncio
import re
from typing import List

from app.platforms.bluesky import BlueskyPlatform
from app.platforms.devto import DevToPlatform
from app.platforms.discord import DiscordPlatform
from app.platforms.mastodon import MastodonPlatform
from app.platforms.telegraph import TelegraphPlatform
from app.schemas import PlatformResult, PostingResponse

URL_PATTERN = re.compile(r"https?://[^\s<>\"'`\]]+", re.IGNORECASE)


async def dispatch_to_platforms(message: str) -> PostingResponse:
    cta_url = URL_PATTERN.findall(message)[0].rstrip(".,!?;:)]")
    platforms = [
        TelegraphPlatform(),
        DevToPlatform(),
        MastodonPlatform(),
        BlueskyPlatform(),
        DiscordPlatform(),
    ]

    raw_results = await asyncio.gather(
        *(p.publish(message=message, cta_url=cta_url) for p in platforms),
        return_exceptions=True,
    )

    results: List[PlatformResult] = []
    for platform, item in zip(platforms, raw_results):
        if isinstance(item, Exception):
            results.append(
                PlatformResult(
                    platform=platform.name,
                    status="failed",
                    posted_url=None,
                    public_access=False,
                    date=None,
                    time=None,
                    error=str(item),
                )
            )
        else:
            results.append(item)

    any_success = any(r.status == "success" for r in results)
    return PostingResponse(success=any_success, results=results)
