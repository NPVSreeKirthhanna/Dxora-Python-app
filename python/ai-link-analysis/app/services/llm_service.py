import json
import time
from typing import Tuple, Type, TypeVar
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import get_settings
from app.utils.validators import URLValidationError

T = TypeVar("T", bound=BaseModel)


class LLMService:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise URLValidationError("GEMINI_API_KEY is not configured.", 503)
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.models = [settings.primary_model, settings.fallback_model]

    def generate_structured(
        self, prompt: str, system_instruction: str, response_schema: Type[T]
    ) -> Tuple[T, str, int, int | None, int | None]:
        last_error: Exception | None = None
        start = time.perf_counter()

        for model_name in self.models:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                )
                latency_ms = int((time.perf_counter() - start) * 1000)
                parsed = response_schema.model_validate(json.loads(response.text or "{}"))
                usage = response.usage_metadata
                return (
                    parsed,
                    model_name,
                    latency_ms,
                    getattr(usage, "prompt_token_count", None),
                    getattr(usage, "candidates_token_count", None),
                )
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                continue

        raise URLValidationError(f"LLM generation failed across fallback ladder: {last_error}", 502)
