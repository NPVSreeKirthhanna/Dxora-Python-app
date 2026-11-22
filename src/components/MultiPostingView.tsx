import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react';
import type { PostingApiResponse } from '../types';

const SAMPLE_MESSAGE =
  'Explore our AI-powered website SEO & competitor intelligence suite today. https://example.com';

export function MultiPostingView() {
  const [message, setMessage] = useState(SAMPLE_MESSAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostingApiResponse | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const validation = useMemo(() => {
    const trimmed = message.trim();
    const charCount = trimmed.length;
    const links = trimmed.match(/https?:\/\/[^\s<>"'`\]]+/gi) ?? [];
    const withinLimit = charCount > 0 && charCount <= 200;
    const exactOneLink = links.length === 1;
    return {
      charCount,
      linkCount: links.length,
      withinLimit,
      exactOneLink,
      isValid: withinLimit && exactOneLink,
    };
  }, [message]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || `Validation failed (${res.status})`);
        return;
      }

      setResult(data as PostingApiResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : 'Unable to reach multi-platform posting service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Composer Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Automated Multi-Platform Publisher
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Submits a validated broadcast to <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">POST /posting</code>. Platform routing is handled internally across Telegraph, Dev.to, Mastodon, Bluesky, and Discord, isolating failures per provider.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="broadcast-message" className="font-medium text-slate-700">
                Broadcast Message (200 chars max, exactly 1 CTA link)
              </label>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span
                  className={
                    validation.exactOneLink ? 'text-emerald-700' : 'text-rose-700 font-medium'
                  }
                >
                  {validation.linkCount} CTA {validation.linkCount === 1 ? 'link' : 'links'}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span
                  className={
                    validation.charCount > 200
                      ? 'text-rose-700 font-medium'
                      : 'text-slate-600'
                  }
                >
                  {validation.charCount} / 200 chars
                </span>
              </div>
            </div>

            <textarea
              id="broadcast-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a concise update with one https:// CTA link..."
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setMessage(SAMPLE_MESSAGE)}
                className="text-slate-700 hover:text-indigo-600 underline decoration-slate-300 underline-offset-4 cursor-pointer"
              >
                Reset sample message
              </button>
              <span aria-hidden="true">·</span>
              <span>Telegraph publishes live; Dev.to, Mastodon, Bluesky & Discord use server env credentials</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish to All Platforms
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">Validation Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </section>

      {/* Results Table */}
      {result && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Platform Dispatch Results
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>{result.summary.total_platforms} platforms</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">
                  {result.summary.succeeded} succeeded
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">{result.summary.failed} failed</span>
                <span aria-hidden="true">·</span>
                <span>CTA: {result.cta_url}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCopyJson()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied JSON
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Response JSON
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                <tr>
                  <th className="py-2.5 px-6">Platform</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Posted URL</th>
                  <th className="py-2.5 px-4">Public Access</th>
                  <th className="py-2.5 px-4">Date (UTC)</th>
                  <th className="py-2.5 px-4">Time (UTC)</th>
                  <th className="py-2.5 px-6">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.results.map((item) => (
                  <tr key={item.platform} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-medium text-slate-900 whitespace-nowrap">
                      {item.platform}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.posted_url ? (
                        <a
                          href={item.posted_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-mono text-xs underline underline-offset-2"
                        >
                          {item.posted_url}
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {item.public_access ? 'Public' : 'Private / N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {item.date ?? '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {item.time ?? '—'}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600">
                      {item.error ?? <span className="text-slate-400">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
