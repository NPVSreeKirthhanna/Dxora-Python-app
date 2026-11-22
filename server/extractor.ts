import * as cheerio from 'cheerio';
import { validatePublicUrl, ValidationError } from './validators.js';

export interface ExtractedWebsiteData {
  finalUrl: string;
  title: string;
  metaDescription: string;
  ogSiteName: string;
  canonicalUrl: string;
  h1: string[];
  h2: string[];
  h3: string[];
  navAndServiceLabels: string[];
  cleanedBodyText: string;
  rawHtmlBytes: number;
  cleanedChars: number;
  tokensSavedEstimatePct: number;
  fetchLatencyMs: number;
}

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 12000;
const MAX_CLEAN_CHARS = 7500;

export async function fetchAndExtractWebsite(rawUrl: string): Promise<ExtractedWebsiteData> {
  const startMs = Date.now();
  let currentUrl = await validatePublicUrl(rawUrl);
  let response: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(currentUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LinkScopeAnalyzer/1.0; +https://example.org/bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      clearTimeout(timeout);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          throw new ValidationError('Website returned an invalid redirect without Location.', 502);
        }
        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = await validatePublicUrl(nextUrl);
        continue;
      }

      response = res;
      break;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof ValidationError) throw err;
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      throw new ValidationError(
        isTimeout
          ? 'Timed out while fetching the target website (12s limit).'
          : 'Unable to connect to the target website. Verify the domain is publicly accessible.',
        502
      );
    }
  }

  if (!response) {
    throw new ValidationError('Exceeded maximum HTTP redirect limit (4 hops).', 502);
  }

  if (!response.ok) {
    throw new ValidationError(
      `Target website responded with HTTP ${response.status} (${response.statusText || 'Error'}).`,
      502
    );
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (
    contentType &&
    !contentType.includes('text/html') &&
    !contentType.includes('application/xhtml+xml') &&
    !contentType.includes('text/plain')
  ) {
    throw new ValidationError(
      `Unsupported content type "${contentType}". Expected an HTML webpage.`,
      422
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_HTML_BYTES) {
    throw new ValidationError('Website HTML exceeds the 2 MB extraction limit.', 422);
  }

  const html = Buffer.from(arrayBuffer).toString('utf-8');
  const rawHtmlBytes = arrayBuffer.byteLength;
  const fetchLatencyMs = Date.now() - startMs;

  const $ = cheerio.load(html);

  // Strip non-content boilerplate to reduce noise and LLM token spend
  $('script, style, noscript, svg, iframe, template, canvas').remove();

  const title = $('title').first().text().replace(/\s+/g, ' ').trim();
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim() || '';
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';

  const collectText = (selector: string, limit: number): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    $(selector).each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt.length >= 2 && txt.length <= 160 && !seen.has(txt.toLowerCase())) {
        seen.add(txt.toLowerCase());
        out.push(txt);
      }
    });
    return out.slice(0, limit);
  };

  const h1 = collectText('h1', 8);
  const h2 = collectText('h2', 16);
  const h3 = collectText('h3', 16);
  const navAndServiceLabels = collectText('nav a, header a, [class*="service"] h2, [class*="service"] h3', 24);

  // Deduplicate paragraphs & list items for clean content
  const textBlocks: string[] = [];
  const seenBlocks = new Set<string>();
  $('main p, article p, section p, p, li').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (txt.length >= 25 && !seenBlocks.has(txt.toLowerCase())) {
      seenBlocks.add(txt.toLowerCase());
      textBlocks.push(txt);
    }
  });

  let cleanedBodyText = textBlocks.join('\n');
  if (cleanedBodyText.length < 200) {
    cleanedBodyText = $('body').text().replace(/\s+/g, ' ').trim();
  }
  if (cleanedBodyText.length > MAX_CLEAN_CHARS) {
    cleanedBodyText = `${cleanedBodyText.slice(0, MAX_CLEAN_CHARS)}...`;
  }

  if (!title && h1.length === 0 && cleanedBodyText.length < 40) {
    throw new ValidationError(
      'No meaningful readable text could be extracted from the target URL (page may require JavaScript rendering or block automated access).',
      422
    );
  }

  const cleanedChars =
    title.length +
    metaDescription.length +
    h1.join(' ').length +
    h2.join(' ').length +
    cleanedBodyText.length;

  const estimatedRawTokens = Math.max(1, Math.round(rawHtmlBytes / 4));
  const estimatedCleanedTokens = Math.max(1, Math.round(cleanedChars / 4));
  const tokensSavedEstimatePct = Math.max(
    0,
    Math.min(99, Math.round(((estimatedRawTokens - estimatedCleanedTokens) / estimatedRawTokens) * 100))
  );

  return {
    finalUrl: currentUrl.toString(),
    title,
    metaDescription,
    ogSiteName,
    canonicalUrl,
    h1,
    h2,
    h3,
    navAndServiceLabels,
    cleanedBodyText,
    rawHtmlBytes,
    cleanedChars,
    tokensSavedEstimatePct,
    fetchLatencyMs,
  };
}
