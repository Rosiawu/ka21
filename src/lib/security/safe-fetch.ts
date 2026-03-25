import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

type SafeFetchOptions = {
  allowedHostnames?: Iterable<string>;
  maxRedirects?: number;
  timeoutMs?: number;
};

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second, third] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && (third === 0 || third === 2)) ||
    (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase().split('%')[0];

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice('::ffff:'.length));
  }

  return (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  );
}

function isPrivateAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    return isPrivateIpv4(address);
  }
  if (family === 6) {
    return isPrivateIpv6(address);
  }
  return true;
}

async function assertPublicHostname(hostname: string) {
  const family = isIP(hostname);
  if (family > 0) {
    if (isPrivateAddress(hostname)) {
      throw new Error('unsafe-remote-address');
    }
    return;
  }

  const results = await lookup(hostname, { all: true, verbatim: true });
  if (!results.length) {
    throw new Error('unresolved-remote-host');
  }

  if (results.some((result) => isPrivateAddress(result.address))) {
    throw new Error('unsafe-remote-address');
  }
}

async function validateUrl(rawUrl: string | URL, options: SafeFetchOptions) {
  let parsed: URL;
  try {
    parsed = rawUrl instanceof URL ? new URL(rawUrl.toString()) : new URL(rawUrl);
  } catch {
    throw new Error('invalid-source-url');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('invalid-url-protocol');
  }

  if (parsed.username || parsed.password) {
    throw new Error('invalid-url-credentials');
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('blocked-port');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (options.allowedHostnames) {
    const allowedHostnames = new Set(Array.from(options.allowedHostnames, (value) => value.toLowerCase()));
    if (!allowedHostnames.has(hostname)) {
      throw new Error('blocked-hostname');
    }
  }

  await assertPublicHostname(hostname);
  return parsed;
}

function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

export async function safeFetch(
  rawUrl: string | URL,
  init: NextFetchInit = {},
  options: SafeFetchOptions = {},
) {
  const maxRedirects = options.maxRedirects ?? 3;
  let currentUrl = await validateUrl(rawUrl, options);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    const signal = init.signal
      ? AbortSignal.any([init.signal, controller.signal])
      : controller.signal;

    try {
      const response = await fetch(currentUrl.toString(), {
        ...init,
        signal,
        redirect: 'manual',
      });

      if (!isRedirectStatus(response.status)) {
        return response;
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error('redirect-location-missing');
      }

      currentUrl = await validateUrl(new URL(location, currentUrl), options);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('too-many-redirects');
}
