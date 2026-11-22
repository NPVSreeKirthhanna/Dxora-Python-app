import type { PlatformPostResult } from '../src/types.js';

interface PublishPayload {
  message: string;
  ctaUrl: string;
}

function nowDateTime(): { date: string; time: string } {
  const now = new Date();
  const iso = now.toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 19),
  };
}

function failedResult(platform: string, error: string): PlatformPostResult {
  return {
    platform,
    status: 'failed',
    posted_url: null,
    public_access: false,
    date: null,
    time: null,
    error,
  };
}

function successResult(platform: string, postedUrl: string, publicAccess: boolean): PlatformPostResult {
  const { date, time } = nowDateTime();
  return {
    platform,
    status: 'success',
    posted_url: postedUrl,
    public_access: publicAccess,
    date,
    time,
    error: null,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1. Telegraph (telegra.ph) Official REST API
 * Supports publishing via TELEGRAPH_ACCESS_TOKEN or automatic short-lived publisher account creation.
 */
async function publishToTelegraph(payload: PublishPayload): Promise<PlatformPostResult> {
  const platform = 'Telegraph (telegra.ph)';
  try {
    let accessToken = process.env.TELEGRAPH_ACCESS_TOKEN?.trim() || '';

    if (!accessToken) {
      const acctRes = await fetchWithTimeout('https://api.telegra.ph/createAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_name: 'LinkScopeDispatch',
          author_name: 'LinkScope Automated Publisher',
        }),
      });
      const acctJson = (await acctRes.json()) as {
        ok?: boolean;
        result?: { access_token?: string };
        error?: string;
      };
      if (!acctRes.ok || !acctJson.ok || !acctJson.result?.access_token) {
        return failedResult(platform, acctJson.error || `Telegraph account setup HTTP ${acctRes.status}`);
      }
      accessToken = acctJson.result.access_token;
    }

    const titleText = payload.message.replace(payload.ctaUrl, '').trim() || 'Business Update';
    const title = titleText.slice(0, 80);

    const pageRes = await fetchWithTimeout('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        title,
        author_name: 'LinkScope Publisher',
        content: [
          { tag: 'p', children: [payload.message] },
          {
            tag: 'p',
            children: [
              'Call to Action: ',
              { tag: 'a', attrs: { href: payload.ctaUrl }, children: [payload.ctaUrl] },
            ],
          },
        ],
        return_content: false,
      }),
    });

    const pageJson = (await pageRes.json()) as {
      ok?: boolean;
      result?: { url?: string };
      error?: string;
    };

    if (!pageRes.ok || !pageJson.ok || !pageJson.result?.url) {
      return failedResult(platform, pageJson.error || `Telegraph API returned HTTP ${pageRes.status}`);
    }

    return successResult(platform, pageJson.result.url, true);
  } catch (err) {
    return failedResult(platform, err instanceof Error ? err.message : 'Telegraph request failed');
  }
}

/**
 * 2. Dev.to (Forem) Articles REST API
 * Requires DEVTO_API_KEY in server environment.
 */
async function publishToDevTo(payload: PublishPayload): Promise<PlatformPostResult> {
  const platform = 'Dev.to';
  const apiKey = process.env.DEVTO_API_KEY?.trim();
  if (!apiKey) {
    return failedResult(platform, 'Authentication failed: DEVTO_API_KEY is not configured');
  }

  try {
    const headline = payload.message.replace(payload.ctaUrl, '').trim() || 'Platform Announcement';
    const res = await fetchWithTimeout('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'User-Agent': 'LinkScopeDispatch/1.0',
      },
      body: JSON.stringify({
        article: {
          title: headline.slice(0, 120),
          published: true,
          body_markdown: `${payload.message}\n\nLearn more: [${payload.ctaUrl}](${payload.ctaUrl})`,
          tags: ['announcement', 'web', 'productivity'],
        },
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      return failedResult(platform, json.error || `Dev.to API returned HTTP ${res.status}`);
    }
    return successResult(platform, json.url, true);
  } catch (err) {
    return failedResult(platform, err instanceof Error ? err.message : 'Dev.to request failed');
  }
}

/**
 * 3. Mastodon Statuses REST API
 * Requires MASTODON_INSTANCE_URL and MASTODON_ACCESS_TOKEN in server environment.
 */
async function publishToMastodon(payload: PublishPayload): Promise<PlatformPostResult> {
  const platform = 'Mastodon';
  const instanceRaw = process.env.MASTODON_INSTANCE_URL?.trim();
  const token = process.env.MASTODON_ACCESS_TOKEN?.trim();

  if (!instanceRaw || !token) {
    return failedResult(
      platform,
      'Authentication failed: MASTODON_INSTANCE_URL or MASTODON_ACCESS_TOKEN is not configured'
    );
  }

  try {
    const parsedInstance = new URL(instanceRaw);
    if (parsedInstance.protocol !== 'https:') {
      return failedResult(platform, 'Invalid configuration: MASTODON_INSTANCE_URL must use https://');
    }

    const endpoint = `${parsedInstance.origin}/api/v1/statuses`;
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: payload.message,
        visibility: 'public',
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      return failedResult(platform, json.error || `Mastodon API returned HTTP ${res.status}`);
    }
    return successResult(platform, json.url, true);
  } catch (err) {
    return failedResult(platform, err instanceof Error ? err.message : 'Mastodon request failed');
  }
}

/**
 * 4. Bluesky (AT Protocol) REST API
 * Requires BLUESKY_HANDLE and BLUESKY_APP_PASSWORD in server environment.
 */
async function publishToBluesky(payload: PublishPayload): Promise<PlatformPostResult> {
  const platform = 'Bluesky';
  const handle = process.env.BLUESKY_HANDLE?.trim();
  const appPassword = process.env.BLUESKY_APP_PASSWORD?.trim();

  if (!handle || !appPassword) {
    return failedResult(
      platform,
      'Authentication failed: BLUESKY_HANDLE or BLUESKY_APP_PASSWORD is not configured'
    );
  }

  try {
    const sessionRes = await fetchWithTimeout('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    });
    const sessionJson = (await sessionRes.json().catch(() => ({}))) as {
      accessJwt?: string;
      did?: string;
      message?: string;
    };
    if (!sessionRes.ok || !sessionJson.accessJwt || !sessionJson.did) {
      return failedResult(platform, sessionJson.message || `Bluesky auth failed (HTTP ${sessionRes.status})`);
    }

    const linkStart = Buffer.byteLength(
      payload.message.slice(0, payload.message.indexOf(payload.ctaUrl)),
      'utf-8'
    );
    const linkEnd = linkStart + Buffer.byteLength(payload.ctaUrl, 'utf-8');

    const recordRes = await fetchWithTimeout('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionJson.accessJwt}`,
      },
      body: JSON.stringify({
        repo: sessionJson.did,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text: payload.message,
          createdAt: new Date().toISOString(),
          facets: [
            {
              index: { byteStart: linkStart, byteEnd: linkEnd },
              features: [{ $type: 'app.bsky.richtext.facet#link', uri: payload.ctaUrl }],
            },
          ],
        },
      }),
    });

    const recordJson = (await recordRes.json().catch(() => ({}))) as { uri?: string; message?: string };
    if (!recordRes.ok || !recordJson.uri) {
      return failedResult(platform, recordJson.message || `Bluesky post failed (HTTP ${recordRes.status})`);
    }

    const rkey = recordJson.uri.split('/').pop();
    const publicUrl = `https://bsky.app/profile/${handle}/post/${rkey}`;
    return successResult(platform, publicUrl, true);
  } catch (err) {
    return failedResult(platform, err instanceof Error ? err.message : 'Bluesky request failed');
  }
}

/**
 * 5. Discord Webhook API
 * Requires DISCORD_WEBHOOK_URL in server environment.
 */
async function publishToDiscord(payload: PublishPayload): Promise<PlatformPostResult> {
  const platform = 'Discord';
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return failedResult(platform, 'Authentication failed: DISCORD_WEBHOOK_URL is not configured');
  }

  try {
    const parsed = new URL(webhookUrl);
    const allowedHost =
      parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com';
    if (parsed.protocol !== 'https:' || !allowedHost || !parsed.pathname.startsWith('/api/webhooks/')) {
      return failedResult(platform, 'Invalid DISCORD_WEBHOOK_URL format');
    }

    const target = `${parsed.origin}${parsed.pathname}?wait=true`;
    const res = await fetchWithTimeout(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: payload.message,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      channel_id?: string;
      message?: string;
    };

    if (!res.ok) {
      return failedResult(platform, json.message || `Discord webhook returned HTTP ${res.status}`);
    }

    const postedUrl =
      json.channel_id && json.id
        ? `https://discord.com/channels/@me/${json.channel_id}/${json.id}`
        : `${parsed.origin}${parsed.pathname}`;

    return successResult(platform, postedUrl, false);
  } catch (err) {
    return failedResult(platform, err instanceof Error ? err.message : 'Discord webhook request failed');
  }
}

export async function publishToAllPlatforms(
  message: string,
  ctaUrl: string
): Promise<PlatformPostResult[]> {
  const payload: PublishPayload = { message, ctaUrl };
  const publishers = [
    publishToTelegraph,
    publishToDevTo,
    publishToMastodon,
    publishToBluesky,
    publishToDiscord,
  ];

  const settled = await Promise.allSettled(publishers.map((fn) => fn(payload)));

  return settled.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const fallbackNames = ['Telegraph (telegra.ph)', 'Dev.to', 'Mastodon', 'Bluesky', 'Discord'];
    return failedResult(
      fallbackNames[idx] || `Platform ${idx + 1}`,
      result.reason instanceof Error ? result.reason.message : 'Unexpected integration error'
    );
  });
}
