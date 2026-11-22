from fastapi import FastAPI
from app.schemas import PostingRequest, PostingResponse
from app.services.posting_service import dispatch_to_platforms

app = FastAPI(
    title="Automated Multi-Platform Posting API",
    version="1.0.0",
    description="Validates a <=200-char message with one CTA link and publishes independently across 5 platforms.",
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/posting", response_model=PostingResponse)
async def create_posting(payload: PostingRequest) -> PostingResponse:
    return await dispatch_to_platforms(payload.message)
