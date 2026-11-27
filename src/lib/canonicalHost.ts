const CANONICAL_HOST = 'ka21.org';

export interface CanonicalRequestTarget {
  protocol?: string | null;
  hostname: string;
  pathname: string;
  search?: string | null;
  forwardedProto?: string | null;
  cfVisitor?: string | null;
}

function readCfVisitorScheme(cfVisitor?: string | null): 'http' | 'https' | null {
  if (!cfVisitor) return null;
  try {
    const scheme = JSON.parse(cfVisitor).scheme;
    if (scheme === 'http' || scheme === 'https') return scheme;
  } catch {
    return null;
  }
  return null;
}

/**
 * Visitor scheme for ka21.org. Cloudflare's CF-Visitor header is the client
 * scheme; otherwise any explicit http signal wins so http:// is not treated as https.
 */
export function resolvePublicProtocol(input: {
  protocol?: string | null;
  forwardedProto?: string | null;
  cfVisitor?: string | null;
}): 'http' | 'https' {
  const visitorScheme = readCfVisitorScheme(input.cfVisitor);
  if (visitorScheme) return visitorScheme;

  const forwarded = input.forwardedProto?.split(',')[0]?.trim().toLowerCase();
  const urlProtocol = (input.protocol || '').replace(':', '').toLowerCase();
  if (urlProtocol === 'http' || forwarded === 'http') return 'http';
  if (urlProtocol === 'https' || forwarded === 'https') return 'https';
  return 'https';
}

/**
 * Pick the visitor hostname. Next/Cloudflare can expose the bind host, the
 * Host header, and X-Forwarded-Host together; a production name wins.
 */
export function selectPublicHostname(candidates: Array<string | null | undefined>): string {
  const names = candidates.flatMap((value) =>
    (value || '')
      .split(',')
      .map((part) => part.trim().split(':')[0]?.toLowerCase() ?? '')
      .filter(Boolean),
  );
  if (names.includes(`www.${CANONICAL_HOST}`)) return `www.${CANONICAL_HOST}`;
  if (names.includes(CANONICAL_HOST)) return CANONICAL_HOST;
  return names[0] || '';
}

/**
 * Permanent redirect target for the production hosts only.
 * https://ka21.org stays put. www and http move to https://ka21.org.
 * Other hosts (localhost, preview workers) are left alone.
 */
export function getCanonicalRedirectTarget(request: CanonicalRequestTarget): string | null {
  const hostname = request.hostname.split(':')[0]?.trim().toLowerCase() ?? '';
  const isApex = hostname === CANONICAL_HOST;
  const isWww = hostname === `www.${CANONICAL_HOST}`;
  if (!isApex && !isWww) return null;

  const protocol = resolvePublicProtocol(request);
  if (isApex && protocol === 'https') return null;

  const pathname = request.pathname.startsWith('/') ? request.pathname : `/${request.pathname || ''}`;
  const search = request.search || '';
  return `https://${CANONICAL_HOST}${pathname}${search}`;
}
