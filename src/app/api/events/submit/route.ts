import { NextResponse } from 'next/server';
import { submitEvent } from '@/lib/events/store';
import { extractEventFromSourceUrl } from '@/lib/events/extractor';
import { requireAdminAccess } from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'events-submit',
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const sourceUrl = String(body?.sourceUrl || '').trim().slice(0, 1000);
    const extracted =
      sourceUrl && (!body?.title || !body?.summary)
        ? await extractEventFromSourceUrl(sourceUrl)
        : null;

    const entry = await submitEvent({
      title: String(body?.title || extracted?.title || '').trim().slice(0, 80),
      summary: String(body?.summary || extracted?.summary || '').trim().slice(0, 1200),
      sourceUrl: sourceUrl || String(extracted?.sourceUrl || ''),
      organizer: typeof body?.organizer === 'string' ? body.organizer.trim().slice(0, 40) : extracted?.organizer || '',
      author: typeof body?.author === 'string' ? body.author.trim().slice(0, 20) : extracted?.author || '',
      eventDate: typeof body?.eventDate === 'string' ? body.eventDate.trim().slice(0, 20) : extracted?.eventDate || '',
      deadline: typeof body?.deadline === 'string' ? body.deadline.trim().slice(0, 20) : extracted?.deadline || '',
      location: typeof body?.location === 'string' ? body.location.trim().slice(0, 40) : extracted?.location || '',
      sourceLabel: typeof body?.sourceLabel === 'string' ? body.sourceLabel.trim().slice(0, 30) : extracted?.sourceLabel || '',
      tags: Array.isArray(body?.tags) ? body.tags.slice(0, 8) : extracted?.tags || [],
      images: Array.isArray(body?.images) ? body.images : [],
      coverImage: typeof body?.coverImage === 'string' ? body.coverImage.trim().slice(0, 1000) : extracted?.coverImage || '',
    });
    return NextResponse.json({
      success: true,
      data: entry,
      message: '已写入赛事区，等待自动部署完成后即可在赛事页看到。',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'submit-failed';
    const status = (
      message.startsWith('missing-') ||
      message === 'invalid-image-data-url' ||
      message === 'invalid-source-url' ||
      message === 'invalid-url-protocol' ||
      message === 'blocked-port' ||
      message === 'blocked-hostname' ||
      message === 'unsafe-remote-address' ||
      message === 'duplicate-source-url' ||
      message === 'wechat-verification-required'
    ) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
