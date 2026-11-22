from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class LinkAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=2048, description="Public website URL to analyze")


class BrandSummary(BaseModel):
    name: str
    category: str
    summary: str


class CompetitorComparisonRow(BaseModel):
    dimension: str
    your_brand: str
    competitor: str


class CompetitorItem(BaseModel):
    name: str
    main_service: str
    target_market: str
    key_strength: str
    weakness_gap: str
    opportunity: str
    source_note: str


class CompetitorAnalysis(BaseModel):
    brand_overview: str
    main_products_services: List[str]
    competitors: List[CompetitorItem]
    strengths: List[str]
    opportunities: List[str]
    comparison_table: List[CompetitorComparisonRow]


class TargetSearchQuery(BaseModel):
    query: str
    platforms: List[Literal["Google", "Facebook", "Instagram", "LinkedIn", "X"]]
    intent: str
    business_relevance: str
    target_audience: str


class SupportingContentIdea(BaseModel):
    content_type: str
    title_idea: str
    purpose: str


class SeoImprovements(BaseModel):
    primary_keyword: str
    secondary_keywords: List[str]
    long_tail_keywords: List[str]
    business_keywords: List[str]
    recommended_title: str
    title_rationale: str
    meta_description: str
    supporting_content: List[SupportingContentIdea]


class TopServiceItem(BaseModel):
    service_name: str
    description: str
    target_industry: str
    target_customer: str
    main_benefit: str
    source: Literal["extracted_from_site", "inferred_recommendation"]


class AudienceSegmentRow(BaseModel):
    audience_label: str
    business_type: str
    requirement: str


class TargetAudience(BaseModel):
    primary_audience: List[str]
    secondary_audience: List[str]
    industries: List[str]
    business_types: List[str]
    customer_profiles: List[str]
    geographic_focus: str
    customer_needs: List[str]
    customer_interests: List[str]
    recommended_segments: List[AudienceSegmentRow]


class AnalysisPayload(BaseModel):
    competitor_analysis: CompetitorAnalysis
    target_search_queries: List[TargetSearchQuery]
    seo_improvements: SeoImprovements
    top_services: List[TopServiceItem]
    target_audience: TargetAudience


class ExtractionTelemetry(BaseModel):
    page_title: str
    meta_description: str
    raw_html_bytes: int
    cleaned_chars: int
    fetch_latency_ms: int
    llm_latency_ms: int
    model_used: str
    prompt_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


class LinkAnalysisResponse(BaseModel):
    success: bool = True
    website: str
    brand: BrandSummary
    extraction_telemetry: ExtractionTelemetry
    analysis: AnalysisPayload
