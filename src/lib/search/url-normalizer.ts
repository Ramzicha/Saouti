const TRACKING_PARAM_PREFIXES = ['utm_'];
const TRACKING_EXACT_PARAMS = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'ref',
  'referrer',
  'source',
  'campaign',
]);

/**
 * Normalizes an external URL into a clean canonical format:
 * - Strips all tracking, campaign, and analytics query parameters
 * - Strips URL fragments (#anchor)
 * - Lowercases hostname and protocol
 * - Removes default ports (:80, :443)
 * - Removes trailing slash from path (except root /)
 * - Deterministically sorts any remaining legitimate query parameters
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return trimmed;
    }

    // Lowercase host and strip leading www.
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./i, '');

    // Strip fragment
    parsed.hash = '';

    // Filter tracking query parameters
    const cleanedParams = new URLSearchParams();
    const sortedKeys = Array.from(parsed.searchParams.keys()).sort();

    for (const key of sortedKeys) {
      const lowerKey = key.toLowerCase();
      const isTrackingPrefix = TRACKING_PARAM_PREFIXES.some((prefix) =>
        lowerKey.startsWith(prefix),
      );
      const isTrackingExact = TRACKING_EXACT_PARAMS.has(lowerKey);

      if (!isTrackingPrefix && !isTrackingExact) {
        const values = parsed.searchParams.getAll(key);
        for (const val of values) {
          cleanedParams.append(key, val);
        }
      }
    }

    // Replace search parameters with cleaned, sorted version
    parsed.search = cleanedParams.toString() ? `?${cleanedParams.toString()}` : '';

    // Strip trailing slash if pathname is more than just '/'
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, fallback to trimmed input
    return trimmed;
  }
}

/**
 * Extracts a clean, display-friendly domain name (e.g., 'techcrunch.com' from 'https://www.techcrunch.com/article/...')
 */
export function extractSourceDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'web';
  }
}
