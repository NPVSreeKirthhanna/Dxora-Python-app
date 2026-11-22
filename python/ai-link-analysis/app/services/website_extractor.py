import time
from dataclasses import dataclass
from typing import List
from urllib.parse import urljoin
import httpx
from bs4 import BeautifulSoup

from app.config import get_settings
from app.utils.validators import URLValidationError, validate_public_url


@dataclass
class ExtractedWebsite:
    final_url: str
    title: str
    meta_description: str
    og_site_name: str
    h1: List[str]
    h2: List[str]
    nav_labels: List[str]
    cleaned_body_text: str
    raw_html_bytes: int
    cleaned_chars: int
    fetch_latency_ms: int


async def fetch_and_extract_website(raw_url: str) -> ExtractedWebsite:
    settings = get_settings()
    current_url = validate_public_url(raw_url)
    start = time.perf_counter()

    response: httpx.Response | None = None
    async with httpx.AsyncClient(
        timeout=settings.request_timeout_seconds,
        follow_redirects=False,
        headers={
            "User-Agent": "LinkScopeAnalyzer/1.0 (+https://example.org/bot)",
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
    ) as client:
        for _ in range(5):
            try:
                res = await client.get(current_url)
            except httpx.TimeoutException as exc:
                raise URLValidationError("Timed out while fetching website.", 502) from exc
            except httpx.RequestError as exc:
                raise URLValidationError(f"Failed to connect to website: {exc}", 502) from exc

            if 300 <= res.status_code < 400 and "location" in res.headers:
                next_url = urljoin(current_url, res.headers["location"])
                current_url = validate_public_url(next_url)
                continue

            response = res
            break

    if response is None:
        raise URLValidationError("Exceeded maximum HTTP redirect limit.", 502)
    if response.status_code >= 400:
        raise URLValidationError(f"Website returned HTTP {response.status_code}.", 502)

    raw_bytes = response.content
    if len(raw_bytes) > settings.max_html_bytes:
        raise URLValidationError("Website HTML exceeds 2 MB limit.", 422)

    fetch_latency_ms = int((time.perf_counter() - start) * 1000)
    soup = BeautifulSoup(raw_bytes, "lxml")

    for tag in soup(["script", "style", "noscript", "svg", "iframe", "template"]):
        tag.decompose()

    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    meta_tag = soup.find("meta", attrs={"name": "description"}) or soup.find(
        "meta", attrs={"property": "og:description"}
    )
    meta_description = (meta_tag.get("content") or "").strip() if meta_tag else ""
    og_site_tag = soup.find("meta", attrs={"property": "og:site_name"})
    og_site_name = (og_site_tag.get("content") or "").strip() if og_site_tag else ""

    def collect(selector: str, limit: int) -> List[str]:
        seen = set()
        items: List[str] = []
        for node in soup.select(selector):
            txt = " ".join(node.get_text(" ", strip=True).split())
            if 2 <= len(txt) <= 160 and txt.lower() not in seen:
                seen.add(txt.lower())
                items.append(txt)
                if len(items) >= limit:
                    break
        return items

    h1 = collect("h1", 8)
    h2 = collect("h2", 16)
    nav_labels = collect("nav a, header a", 20)

    blocks: List[str] = []
    seen_blocks = set()
    for node in soup.select("main p, article p, section p, p, li"):
        txt = " ".join(node.get_text(" ", strip=True).split())
        if len(txt) >= 25 and txt.lower() not in seen_blocks:
            seen_blocks.add(txt.lower())
            blocks.append(txt)

    cleaned_text = "\n".join(blocks)
    if len(cleaned_text) < 200 and soup.body:
        cleaned_text = " ".join(soup.body.get_text(" ", strip=True).split())
    cleaned_text = cleaned_text[: settings.max_clean_chars]

    if not title and not h1 and len(cleaned_text) < 40:
        raise URLValidationError("Unable to extract readable content from website.", 422)

    cleaned_chars = len(title) + len(meta_description) + len(cleaned_text)
    return ExtractedWebsite(
        final_url=current_url,
        title=title,
        meta_description=meta_description,
        og_site_name=og_site_name,
        h1=h1,
        h2=h2,
        nav_labels=nav_labels,
        cleaned_body_text=cleaned_text,
        raw_html_bytes=len(raw_bytes),
        cleaned_chars=cleaned_chars,
        fetch_latency_ms=fetch_latency_ms,
    )
