import re
from typing import List, Literal, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field, field_validator

URL_PATTERN = re.compile(r"https?://[^\s<>\"'`\]]+", re.IGNORECASE)


class PostingRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=200)

    @field_validator("message")
    @classmethod
    def validate_message_and_single_cta(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty.")
        if len(trimmed) > 200:
            raise ValueError(f"Message must not exceed 200 characters (got {len(trimmed)}).")

        matches = [m.rstrip(".,!?;:)]") for m in URL_PATTERN.findall(trimmed)]
        if len(matches) == 0:
            raise ValueError("Message must contain exactly one CTA link (http:// or https://).")
        if len(matches) > 1:
            raise ValueError(f"Message must contain exactly one CTA link (found {len(matches)}).")

        parsed = urlparse(matches[0])
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or "." not in parsed.netloc:
            raise ValueError("CTA link must be a valid public HTTP/HTTPS URL.")
        return trimmed


class PlatformResult(BaseModel):
    platform: str
    status: Literal["success", "failed"]
    posted_url: Optional[str] = None
    public_access: bool = False
    date: Optional[str] = None
    time: Optional[str] = None
    error: Optional[str] = None


class PostingResponse(BaseModel):
    success: bool
    results: List[PlatformResult]
