export interface CompetitorComparisonRow {
  dimension: string;
  your_brand: string;
  competitor: string;
}

export interface CompetitorItem {
  name: string;
  main_service: string;
  target_market: string;
  key_strength: string;
  weakness_gap: string;
  opportunity: string;
  source_note: string;
}

export interface TargetSearchQuery {
  query: string;
  platforms: Array<'Google' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'X'>;
  intent: string;
  business_relevance: string;
  target_audience: string;
}

export interface SupportingContentIdea {
  content_type: string;
  title_idea: string;
  purpose: string;
}

export interface TopServiceItem {
  service_name: string;
  description: string;
  target_industry: string;
  target_customer: string;
  main_benefit: string;
  source: 'extracted_from_site' | 'inferred_recommendation';
}

export interface AudienceSegmentRow {
  audience_label: string;
  business_type: string;
  requirement: string;
}

export interface LinkAnalysisResponse {
  success: boolean;
  website: string;
  brand: {
    name: string;
    category: string;
    summary: string;
  };
  extraction_telemetry: {
    page_title: string;
    meta_description: string;
    h1_headings: string[];
    raw_html_bytes: number;
    cleaned_chars: number;
    tokens_saved_estimate_pct: number;
    fetch_latency_ms: number;
    llm_latency_ms: number;
    model_used: string;
    prompt_tokens: number;
    output_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
  };
  analysis: {
    competitor_analysis: {
      brand_overview: string;
      main_products_services: string[];
      competitors: CompetitorItem[];
      strengths: string[];
      opportunities: string[];
      comparison_table: CompetitorComparisonRow[];
    };
    target_search_queries: TargetSearchQuery[];
    seo_improvements: {
      primary_keyword: string;
      secondary_keywords: string[];
      long_tail_keywords: string[];
      business_keywords: string[];
      recommended_title: string;
      title_rationale: string;
      meta_description: string;
      supporting_content: SupportingContentIdea[];
    };
    top_services: TopServiceItem[];
    target_audience: {
      primary_audience: string[];
      secondary_audience: string[];
      industries: string[];
      business_types: string[];
      customer_profiles: string[];
      geographic_focus: string;
      customer_needs: string[];
      customer_interests: string[];
      recommended_segments: AudienceSegmentRow[];
    };
  };
}

export interface PlatformPostResult {
  platform: string;
  status: 'success' | 'failed';
  posted_url: string | null;
  public_access: boolean;
  date: string | null;
  time: string | null;
  error: string | null;
}

export interface PostingApiResponse {
  success: boolean;
  message: string;
  cta_url: string;
  character_count: number;
  summary: {
    total_platforms: number;
    succeeded: number;
    failed: number;
  };
  results: PlatformPostResult[];
}

export interface PythonBlueprintFile {
  path: string;
  language: string;
  content: string;
}

export interface PythonBlueprintProject {
  id: 'ai-link-analysis' | 'automated-posting';
  title: string;
  port: number;
  files: PythonBlueprintFile[];
}
