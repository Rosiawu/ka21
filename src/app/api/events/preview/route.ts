import { NextResponse } from 'next/server';
import { extractEventFromSourceUrl } from '@/lib/events/extractor';
import { requireAdminAccess } from '@/lib/security/admin';
import { beginConcurrencyLease, enforceRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'events-preview',
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const releaseConcurrency = beginConcurrencyLease('events-preview', 2);
  if (!releaseConcurrency) {
    return NextResponse.json({ success: false, message: 'events-preview-busy' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const sourceUrl = String(body?.sourceUrl || '').trim().slice(0, 1000);
    if (!sourceUrl) {
      return NextResponse.json({ success: false, message: 'missing-source-url' }, { status: 400 });
    }

    const data = await extractEventFromSourceUrl(sourceUrl);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'preview-failed';
    const status = (
      message === 'invalid-source-url' ||
      message === 'invalid-url-protocol' ||
      message === 'blocked-port' ||
      message === 'blocked-hostname' ||
      message === 'unsafe-remote-address' ||
      message === 'wechat-verification-required' ||
      message === 'extract-title-failed'
    ) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  } finally {
    releaseConcurrency();
  }
}
