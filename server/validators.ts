import dns from 'node:dns/promises';
import net from 'node:net';

export class ValidationError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return -1;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr(ipInt: number, baseIp: string, prefixLen: number): boolean {
  const baseInt = ipv4ToInt(baseIp);
  if (baseInt === -1 || ipInt === -1) return true;
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

export function isPrivateOrReservedIp(rawIp: string): boolean {
  const trimmed = rawIp.trim().toLowerCase();
  // Handle IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (trimmed.startsWith('::ffff:')) {
    const mapped = trimmed.slice(7);
    if (net.isIPv4(mapped)) {
      return isPrivateOrReservedIp(mapped);
    }
    // Hex-encoded IPv4-mapped like ::ffff:7f00:1
    const hexParts = mapped.split(':');
    if (hexParts.length === 2) {
      const hi = Number.parseInt(hexParts[0], 16);
      const lo = Number.parseInt(hexParts[1], 16);
      if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        const ipv4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
        return isPrivateOrReservedIp(ipv4);
      }
    }
  }

  if (net.isIPv4(trimmed)) {
    const ipInt = ipv4ToInt(trimmed);
    if (ipInt === -1) return true;
    return (
      inCidr(ipInt, '0.0.0.0', 8) ||
      inCidr(ipInt, '10.0.0.0', 8) ||
      inCidr(ipInt, '100.64.0.0', 10) ||
      inCidr(ipInt, '127.0.0.0', 8) ||
      inCidr(ipInt, '169.254.0.0', 16) ||
      inCidr(ipInt, '172.16.0.0', 12) ||
      inCidr(ipInt, '192.0.0.0', 24) ||
      inCidr(ipInt, '192.0.2.0', 24) ||
      inCidr(ipInt, '192.168.0.0', 16) ||
      inCidr(ipInt, '198.18.0.0', 15) ||
      inCidr(ipInt, '198.51.100.0', 24) ||
      inCidr(ipInt, '203.0.113.0', 24) ||
      inCidr(ipInt, '224.0.0.0', 4)
    );
  }

  if (net.isIPv6(trimmed)) {
    const normalized = trimmed.split('%')[0];
    if (normalized === '::' || normalized === '::1') return true;
    // Unique local (fc00::/7 -> fc.. or fd..)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // Link-local (fe80::/10 -> fe8., fe9., fea., feb.)
    if (/^fe[89ab]/.test(normalized)) return true;
    // Multicast (ff00::/8)
    if (normalized.startsWith('ff')) return true;
    return false;
  }

  return true;
}

export async function validatePublicUrl(rawInput: unknown): Promise<URL> {
  if (typeof rawInput !== 'string') {
    throw new ValidationError('A valid website URL string is required.', 400);
  }

  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new ValidationError('URL must be a non-empty string under 2048 characters.', 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ValidationError('Invalid URL format. Include http:// or https://.', 400);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('Only http:// and https:// URLs are supported.', 400);
  }

  if (parsed.username || parsed.password) {
    throw new ValidationError('URLs containing embedded credentials are not allowed.', 400);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) {
    throw new ValidationError('URL must include a valid hostname.', 400);
  }

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new ValidationError('Access to private or internal network hosts is blocked.', 400);
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new ValidationError('Access to private, loopback, or reserved IP addresses is blocked.', 400);
    }
    return parsed;
  }

  if (!hostname.includes('.')) {
    throw new ValidationError('Hostname must be a fully qualified public domain.', 400);
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new ValidationError('Domain could not be resolved.', 422);
    }
    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new ValidationError(
          'Resolved IP address belongs to a private or reserved network range and is blocked.',
          400
        );
      }
    }
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('Domain DNS lookup failed or the website host is unreachable.', 422);
  }

  return parsed;
}

export async function validatePostingMessage(rawMessage: unknown): Promise<{
  message: string;
  ctaUrl: string;
  characterCount: number;
}> {
  if (typeof rawMessage !== 'string') {
    throw new ValidationError('Request body must include a string "message" field.', 400);
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) {
    throw new ValidationError('Message cannot be empty.', 400);
  }

  if (trimmed.length > 200) {
    throw new ValidationError(
      `Message must not exceed 200 characters (received ${trimmed.length} characters).`,
      400,
      { character_count: trimmed.length, max_characters: 200 }
    );
  }

  const rawMatches = trimmed.match(/https?:\/\/[^\s<>"'`\]]+/gi) ?? [];
  const cleanedUrls = rawMatches.map((u) => u.replace(/[.,!?;:)\]]+$/, ''));

  if (cleanedUrls.length === 0) {
    throw new ValidationError(
      'Message must include exactly one valid CTA link (http:// or https://).',
      400,
      { found_links: 0 }
    );
  }

  if (cleanedUrls.length > 1) {
    throw new ValidationError(
      `Message must include exactly one CTA link, but found ${cleanedUrls.length} links.`,
      400,
      { found_links: cleanedUrls.length }
    );
  }

  const validatedUrl = await validatePublicUrl(cleanedUrls[0]);

  return {
    message: trimmed,
    ctaUrl: validatedUrl.toString(),
    characterCount: trimmed.length,
  };
}
