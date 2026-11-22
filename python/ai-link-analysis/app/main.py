from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.schemas import LinkAnalysisRequest, LinkAnalysisResponse
from app.services.analysis_service import run_link_analysis
from app.utils.validators import URLValidationError

app = FastAPI(
    title="AI-Powered Website Link Analysis API",
    version="1.0.0",
    description="Analyzes a public website URL and produces structured competitor, search query, SEO, services, and audience intelligence.",
)


@app.exception_handler(URLValidationError)
async def url_validation_exception_handler(_, exc: URLValidationError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": str(exc)})


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/link-analysis", response_model=LinkAnalysisResponse)
async def link_analysis(payload: LinkAnalysisRequest) -> LinkAnalysisResponse:
    try:
        return await run_link_analysis(payload.url)
    except URLValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
