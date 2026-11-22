import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  Loader2,
  Search,
} from 'lucide-react';
import type { LinkAnalysisResponse } from '../types';

const SAMPLE_URLS = [
  { label: 'Stripe', url: 'https://stripe.com' },
  { label: 'Linear', url: 'https://linear.app' },
  { label: 'Vercel', url: 'https://vercel.com' },
  { label: 'Example.com', url: 'https://example.com' },
];

type SectionTab =
  | 'competitors'
  | 'queries'
  | 'seo'
  | 'services'
  | 'audience'
  | 'json';

export function LinkAnalysisView() {
  const [url, setUrl] = useState('https://stripe.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkAnalysisResponse | null>(null);
  const [activeSection, setActiveSection] = useState<SectionTab>('competitors');
  const [copiedJson, setCopiedJson] = useState(false);

  const runAnalysis = async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Enter a valid public website URL starting with https:// or http://.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/link-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.detail || `Request failed with status ${res.status}`);
        return;
      }

      setResult(data as LinkAnalysisResponse);
      setActiveSection('competitors');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : 'Unable to reach analysis service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runAnalysis(url);
  };

  const handleCopyJson = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Submission Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Website Link Intelligence
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Fetches live HTML, removes non-content markup, and runs structured analysis across competitors, cross-platform search queries, SEO gaps, core services, and target audiences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              aria-label="Website URL to analyze"
              className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Website
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Run Link Analysis
              </>
            )}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>Quick samples:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.url}
              type="button"
              disabled={loading}
              onClick={() => {
                setUrl(sample.url);
                void runAnalysis(sample.url);
              }}
              className="text-slate-700 hover:text-indigo-600 underline decoration-slate-300 underline-offset-4 transition-colors cursor-pointer whitespace-nowrap"
            >
              {sample.label}
            </button>
          ))}
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>Private IPs & localhost are blocked</span>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">Analysis Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 animate-pulse">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-56 bg-slate-200 rounded" />
            <div className="h-4 w-full max-w-xl bg-slate-100 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
          </div>
          <div className="h-64 bg-slate-100 rounded" />
        </section>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-slate-900">
              Ready for Live Extraction & Analysis
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Submit any public URL above to invoke <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">POST /link-analysis</code>. The server validates the URL, strips HTML noise, and returns structured competitor, search query, SEO, service, and audience insights.
            </p>
            <button
              type="button"
              onClick={() => void runAnalysis(url)}
              className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Analyze {url}
            </button>
          </div>
        </section>
      )}

      {/* Populated Analysis Result */}
      {!loading && result && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Brand Summary + Telemetry Strip */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-indigo-700">{result.brand.category}</span>
                  <span aria-hidden="true">·</span>
                  <a
                    href={result.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    {result.website}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <h2 className="mt-1.5 text-2xl font-semibold text-slate-900">
                  {result.brand.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {result.brand.summary}
                </p>
              </div>
            </div>

            {/* Measured Telemetry Row */}
            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-xs text-slate-500">Model Used</div>
                <div className="mt-1 text-sm font-mono font-medium text-slate-900 truncate">
                  {result.extraction_telemetry.model_used}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Fetch / LLM Time</div>
                <div className="mt-1 text-sm font-mono tabular-nums text-slate-900">
                  {result.extraction_telemetry.fetch_latency_ms}ms / {result.extraction_telemetry.llm_latency_ms}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">HTML Stripped</div>
                <div className="mt-1 text-sm font-mono tabular-nums text-slate-900">
                  {(result.extraction_telemetry.raw_html_bytes / 1024).toFixed(1)} KB → {result.extraction_telemetry.cleaned_chars} ch
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Token Savings</div>
                <div className="mt-1 text-sm font-mono tabular-nums text-emerald-700 font-medium">
                  ~{result.extraction_telemetry.tokens_saved_estimate_pct}% saved
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tokens (In / Out)</div>
                <div className="mt-1 text-sm font-mono tabular-nums text-slate-900">
                  {result.extraction_telemetry.prompt_tokens.toLocaleString()} / {result.extraction_telemetry.output_tokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Est. API Cost</div>
                <div className="mt-1 text-sm font-mono tabular-nums text-slate-900">
                  ${result.extraction_telemetry.estimated_cost_usd.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1" role="tablist" aria-label="Analysis sections">
              {(
                [
                  { id: 'competitors', label: '01. Competitor Analysis' },
                  { id: 'queries', label: '02. Search Queries' },
                  { id: 'seo', label: '03. SEO Improvements' },
                  { id: 'services', label: '04. Top 5 Services' },
                  { id: 'audience', label: '05. Target Audience' },
                  { id: 'json', label: 'Raw JSON' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeSection === tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === tab.id
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            {activeSection === 'competitors' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">Brand Overview</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.analysis.competitor_analysis.brand_overview}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Main Products & Services
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.competitor_analysis.main_products_services.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 font-mono text-xs mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Comparison Table */}
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-3">
                    Your Brand vs Primary Competitor
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4">Comparison</th>
                          <th className="py-2.5 px-4">Your Brand</th>
                          <th className="py-2.5 px-4">Primary Competitor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.analysis.competitor_analysis.comparison_table.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-medium text-slate-900">{row.dimension}</td>
                            <td className="py-3 px-4 text-slate-700">{row.your_brand}</td>
                            <td className="py-3 px-4 text-slate-600">{row.competitor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Identified Competitors Matrix */}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      Identified Competitors ({result.analysis.competitor_analysis.competitors.length})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Competitor entries include source attribution when AI-suggested
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4">Competitor</th>
                          <th className="py-2.5 px-4">Target Market</th>
                          <th className="py-2.5 px-4">Key Strength</th>
                          <th className="py-2.5 px-4">Weakness / Gap</th>
                          <th className="py-2.5 px-4">Positioning Opportunity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.analysis.competitor_analysis.competitors.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 align-top">
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-900">{comp.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{comp.main_service}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{comp.source_note}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">{comp.target_market}</td>
                            <td className="py-3 px-4 text-slate-700">{comp.key_strength}</td>
                            <td className="py-3 px-4 text-slate-600">{comp.weakness_gap}</td>
                            <td className="py-3 px-4 text-slate-700">{comp.opportunity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Advantages & Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Competitive Advantages
                    </h4>
                    <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                      {result.analysis.competitor_analysis.strengths.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Market Positioning Opportunities
                    </h4>
                    <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                      {result.analysis.competitor_analysis.opportunities.map((op, idx) => (
                        <li key={idx} className="leading-relaxed">
                          • {op}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'queries' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Top 5 Target Search Queries
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mapped across Google, Facebook, Instagram, LinkedIn, and X. Search volumes are intentionally omitted unless backed by a live keyword telemetry API.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Search Query</th>
                        <th className="py-2.5 px-4">Platforms</th>
                        <th className="py-2.5 px-4">Search Intent</th>
                        <th className="py-2.5 px-4">Target Audience</th>
                        <th className="py-2.5 px-4">Business Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.analysis.target_search_queries.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 align-top">
                          <td className="py-3 px-4 font-medium text-slate-900">{q.query}</td>
                          <td className="py-3 px-4 text-xs text-indigo-700 font-medium">
                            {q.platforms.join(' · ')}
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{q.intent}</td>
                          <td className="py-3 px-4 text-slate-700">{q.target_audience}</td>
                          <td className="py-3 px-4 text-slate-600">{q.business_relevance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'seo' && (
              <div className="space-y-8">
                {/* Title & Meta Description */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Recommended SEO Title</span>
                      <span className="font-mono tabular-nums">
                        {result.analysis.seo_improvements.recommended_title.length} chars
                      </span>
                    </div>
                    <div className="mt-1.5 text-base font-semibold text-indigo-700">
                      {result.analysis.seo_improvements.recommended_title}
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {result.analysis.seo_improvements.title_rationale}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Recommended Meta Description</span>
                      <span className="font-mono tabular-nums">
                        {result.analysis.seo_improvements.meta_description.length} chars
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">
                      {result.analysis.seo_improvements.meta_description}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Current page title: {result.extraction_telemetry.page_title || '(none detected)'}
                    </p>
                  </div>
                </div>

                {/* Keyword Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Primary Keyword</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {result.analysis.seo_improvements.primary_keyword}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Secondary Keywords</div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {result.analysis.seo_improvements.secondary_keywords.map((kw, i) => (
                        <li key={i}>{kw}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Long-Tail Keywords</div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {result.analysis.seo_improvements.long_tail_keywords.map((kw, i) => (
                        <li key={i}>{kw}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Business Keywords</div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {result.analysis.seo_improvements.business_keywords.map((kw, i) => (
                        <li key={i}>{kw}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Supporting Content */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-3">
                    Recommended Supporting Content
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4">Content Format</th>
                          <th className="py-2.5 px-4">Recommended Topic / Page</th>
                          <th className="py-2.5 px-4">Visibility Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.analysis.seo_improvements.supporting_content.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                              {item.content_type}
                            </td>
                            <td className="py-3 px-4 text-slate-800">{item.title_idea}</td>
                            <td className="py-3 px-4 text-slate-600">{item.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'services' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Top 5 Identified Services</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grounded directly in extracted webpage copy wherever available; inferred items are explicitly marked.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Service Name</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Target Industry</th>
                        <th className="py-2.5 px-4">Target Customer</th>
                        <th className="py-2.5 px-4">Main Benefit</th>
                        <th className="py-2.5 px-4">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.analysis.top_services.map((svc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 align-top">
                          <td className="py-3 px-4 font-medium text-slate-900">{svc.service_name}</td>
                          <td className="py-3 px-4 text-slate-700">{svc.description}</td>
                          <td className="py-3 px-4 text-slate-700">{svc.target_industry}</td>
                          <td className="py-3 px-4 text-slate-700">{svc.target_customer}</td>
                          <td className="py-3 px-4 text-slate-600">{svc.main_benefit}</td>
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            {svc.source === 'extracted_from_site' ? (
                              <span className="text-emerald-700 font-medium">Extracted from site</span>
                            ) : (
                              <span className="text-amber-700 font-medium">Inferred recommendation</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'audience' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Primary Target Audience</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.target_audience.primary_audience.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Secondary Audience</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.target_audience.secondary_audience.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Geographic Focus</h4>
                    <p className="mt-2 text-sm text-slate-700">
                      {result.analysis.target_audience.geographic_focus}
                    </p>
                    <h4 className="mt-4 text-sm font-semibold text-slate-900">Industry Segments</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {result.analysis.target_audience.industries.join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Customer Profiles</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.target_audience.customer_profiles.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Needs & Challenges</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.target_audience.customer_needs.map((n, i) => (
                        <li key={i}>• {n}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Potential Interests</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {result.analysis.target_audience.customer_interests.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-3">
                    Recommended Marketing Audience Segments
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4">Audience</th>
                          <th className="py-2.5 px-4">Business Type</th>
                          <th className="py-2.5 px-4">Core Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.analysis.target_audience.recommended_segments.map((seg, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {seg.audience_label}
                            </td>
                            <td className="py-3 px-4 text-slate-700">{seg.business_type}</td>
                            <td className="py-3 px-4 text-slate-600">{seg.requirement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">
                    POST /link-analysis response payload
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyJson()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[540px] leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
