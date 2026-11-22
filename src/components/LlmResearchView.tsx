import { useMemo, useState } from 'react';

interface ModelComparisonRow {
  provider: string;
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  expectedSpeed: string;
  contextWindow: string;
  jsonSupport: string;
  accuracyNote: string;
  suitability: string;
}

const MODEL_COMPARISON: ModelComparisonRow[] = [
  {
    provider: 'Google Gemini',
    model: 'gemini-4-hydrogen (Primary)',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    expectedSpeed: '1.8s – 3.5s (est.)',
    contextWindow: '1,000,000 tokens',
    jsonSupport: 'Native responseSchema + enum validation',
    accuracyNote: 'High synthesis quality for multi-section SEO & competitor reasoning',
    suitability: 'Recommended Primary',
  },
  {
    provider: 'Google Gemini',
    model: 'gemini-3.1-flash-lite (Fallback)',
    inputPer1M: 0.075,
    outputPer1M: 0.30,
    expectedSpeed: '0.9s – 2.0s (est.)',
    contextWindow: '1,000,000 tokens',
    jsonSupport: 'Native responseSchema',
    accuracyNote: 'Strong structured extraction at lowest token cost',
    suitability: 'High-Availability Fallback',
  },
  {
    provider: 'OpenAI',
    model: 'gpt-4o-mini',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    expectedSpeed: '2.0s – 4.2s (est.)',
    contextWindow: '128,000 tokens',
    jsonSupport: 'Strict JSON Schema (Structured Outputs)',
    accuracyNote: 'Reliable instruction following; smaller context window for large pages',
    suitability: 'Strong Cross-Vendor Alternative',
  },
  {
    provider: 'Anthropic',
    model: 'claude-3-5-haiku',
    inputPer1M: 0.80,
    outputPer1M: 4.00,
    expectedSpeed: '1.8s – 3.8s (est.)',
    contextWindow: '200,000 tokens',
    jsonSupport: 'Tool-use schema enforcement',
    accuracyNote: 'Crisp editorial copywriting; 5x–6x higher output token cost',
    suitability: 'Higher-Cost Alternative',
  },
];

const OPTIMIZATION_PRACTICES = [
  {
    strategy: 'HTML Boilerplate & Tag Stripping',
    impact: '70% – 88% input token reduction',
    implementation:
      'Remove <script>, <style>, <svg>, <noscript>, and <template> before serialization via Cheerio / BeautifulSoup.',
  },
  {
    strategy: 'Paragraph Deduplication & Character Cap',
    impact: 'Prevents navigation & footer repetition',
    implementation:
      'Hash normalized paragraph text to strip repeated headers/menus and cap cleaned body text at 7,500 chars (~1,850 tokens).',
  },
  {
    strategy: 'Strict JSON Schema Enforcement',
    impact: 'Zero retry waste on malformed JSON',
    implementation:
      'Use responseMimeType: "application/json" + responseSchema so output maps directly to Pydantic / TypeScript interfaces.',
  },
  {
    strategy: 'Tiered Model Fallback Ladder',
    impact: 'Balances accuracy & high availability',
    implementation:
      'Route standard extraction to gemini-4-hydrogen and fail over on 429/503 to gemini-3.1-flash-lite.',
  },
  {
    strategy: 'URL + Content-Hash Caching',
    impact: 'Up to 100% savings on repeat URLs',
    implementation:
      'Cache parsed analysis by normalized URL + SHA-256 of extracted text with a 24-hour TTL for repeat lookups.',
  },
];

export function LlmResearchView() {
  const [dailyAnalyses, setDailyAnalyses] = useState(1000);
  const [avgInputTokens, setAvgInputTokens] = useState(2100);
  const [avgOutputTokens, setAvgOutputTokens] = useState(1400);

  const projections = useMemo(() => {
    const monthlyRuns = dailyAnalyses * 30;
    return MODEL_COMPARISON.map((row) => {
      const perCall =
        (avgInputTokens * row.inputPer1M + avgOutputTokens * row.outputPer1M) / 1_000_000;
      const monthlyUsd = perCall * monthlyRuns;
      return {
        ...row,
        perCallUsd: perCall,
        monthlyUsd,
      };
    });
  }, [dailyAnalyses, avgInputTokens, avgOutputTokens]);

  return (
    <div className="space-y-8">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            LLM Platform & Model Research
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Comparative evaluation of LLM providers for production website analysis across API cost, structured JSON reliability, context capacity, and latency. Pricing figures reflect published per-1M token reference rates; latency ranges are estimates unless measured directly in the Link Analysis tab.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-6 border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Provider</th>
                <th className="py-2.5 px-4">Model</th>
                <th className="py-2.5 px-4 text-right">Input / 1M</th>
                <th className="py-2.5 px-4 text-right">Output / 1M</th>
                <th className="py-2.5 px-4">Est. Speed</th>
                <th className="py-2.5 px-4">Context Window</th>
                <th className="py-2.5 px-4">JSON Support</th>
                <th className="py-2.5 px-4">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MODEL_COMPARISON.map((m) => (
                <tr key={m.model} className="hover:bg-slate-50/70 align-top">
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {m.provider}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">{m.model}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    ${m.inputPer1M.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    ${m.outputPer1M.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                    {m.expectedSpeed}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                    {m.contextWindow}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{m.jsonSupport}</td>
                  <td className="py-3 px-4 text-xs font-medium text-indigo-700">{m.suitability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Cost Estimator */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Production Cost & Token Estimator
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Adjust request volume and cleaned token counts to model monthly spend across providers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <label htmlFor="daily-runs">Analyses per Day</label>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {dailyAnalyses.toLocaleString()} / day
              </span>
            </div>
            <input
              id="daily-runs"
              type="range"
              min={100}
              max={25000}
              step={100}
              value={dailyAnalyses}
              onChange={(e) => setDailyAnalyses(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <label htmlFor="input-tokens">Avg Cleaned Input Tokens</label>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {avgInputTokens.toLocaleString()} tok
              </span>
            </div>
            <input
              id="input-tokens"
              type="range"
              min={800}
              max={10000}
              step={100}
              value={avgInputTokens}
              onChange={(e) => setAvgInputTokens(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <label htmlFor="output-tokens">Avg Structured Output Tokens</label>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {avgOutputTokens.toLocaleString()} tok
              </span>
            </div>
            <input
              id="output-tokens"
              type="range"
              min={600}
              max={4000}
              step={100}
              value={avgOutputTokens}
              onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Model</th>
                <th className="py-2.5 px-4 text-right">Est. Cost / Analysis</th>
                <th className="py-2.5 px-4 text-right">Monthly Volume</th>
                <th className="py-2.5 px-4 text-right">Projected Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projections.map((p) => (
                <tr key={p.model} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-medium text-slate-900">{p.model}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    ${p.perCallUsd.toFixed(5)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-600">
                    {(dailyAnalyses * 30).toLocaleString()} runs
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">
                    ${p.monthlyUsd.toFixed(2)} / mo
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Optimization & Final Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Cost Optimization Techniques
          </h2>
          <div className="mt-4 divide-y divide-slate-200">
            {OPTIMIZATION_PRACTICES.map((item) => (
              <div key={item.strategy} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{item.strategy}</h3>
                  <span className="text-xs font-mono text-emerald-700">{item.impact}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.implementation}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Final Model Recommendation
          </h2>
          <dl className="divide-y divide-slate-200 text-sm">
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Recommended Provider</dt>
              <dd className="font-medium text-slate-900 text-right">Google Gemini API</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Primary Model</dt>
              <dd className="font-mono text-xs font-medium text-indigo-700 text-right">
                gemini-4-hydrogen
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Fallback Model</dt>
              <dd className="font-mono text-xs text-slate-800 text-right">
                gemini-3.1-flash-lite
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Est. Input Usage</dt>
              <dd className="font-mono tabular-nums text-slate-900 text-right">~2,100 tokens</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Est. Output Usage</dt>
              <dd className="font-mono tabular-nums text-slate-900 text-right">~1,400 tokens</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Est. Cost / Analysis</dt>
              <dd className="font-mono tabular-nums font-medium text-emerald-700 text-right">
                ~$0.00116 USD
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500">Expected Response Time</dt>
              <dd className="font-mono tabular-nums text-slate-900 text-right">2.0s – 4.0s (est.)</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
            Selected for native JSON schema enforcement, 1M-token context headroom for long landing pages, low per-page cost after Cheerio HTML cleaning, and automatic fallback resilience.
          </p>
        </section>
      </div>
    </div>
  );
}
