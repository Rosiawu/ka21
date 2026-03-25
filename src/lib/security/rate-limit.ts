import { NextResponse } from 'next/server';

type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ConcurrencyMap = Map<string, number>;
type RateLimitMap = Map<string, RateLimitEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __ka21RateLimitStore: RateLimitMap | undefined;
  // eslint-disable-next-line no-var
  var __ka21ConcurrencyStore: ConcurrencyMap | undefined;
}

const rateLimitStore = globalThis.__ka21RateLimitStore || new Map<string, RateLimitEntry>();
const concurrencyStore = globalThis.__ka21ConcurrencyStore || new Map<string, number>();

if (!globalThis.__ka21RateLimitStore) {
  globalThis.__ka21RateLimitStore = rateLimitStore;
}

if (!globalThis.__ka21ConcurrencyStore) {
  globalThis.__ka21ConcurrencyStore = concurrencyStore;
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIp(request: Request) {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0],
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  return candidates[0] || 'unknown';
}

export function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  if (rateLimitStore.size > 512) {
    cleanupExpiredEntries(now);
  }

  const identifier = options.identifier || getClientIp(request);
  const key = `${options.name}:${identifier}`;
  const existing = rateLimitStore.get(key);
  const entry =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : existing;

  entry.count += 1;
  rateLimitStore.set(key, entry);

  if (entry.count <= options.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return NextResponse.json(
    { success: false, message: 'rate-limit-exceeded' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    },
  );
}

export function beginConcurrencyLease(name: string, maxConcurrent: number) {
  const current = concurrencyStore.get(name) || 0;
  if (current >= maxConcurrent) {
    return null;
  }

  concurrencyStore.set(name, current + 1);

  return () => {
    const latest = concurrencyStore.get(name) || 0;
    if (latest <= 1) {
      concurrencyStore.delete(name);
      return;
    }
    concurrencyStore.set(name, latest - 1);
  };
}
