import { NextResponse } from 'next/server';
import { submitEvent } from '@/lib/events/store';
import { extractEventFromSourceUrl } from '@/lib/events/extractor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceUrl = String(body?.sourceUrl || '').trim();
    const extracted =
      sourceUrl && (!body?.title || !body?.summary)
        ? await extractEventFromSourceUrl(sourceUrl)
        : null;

    const entry = await submitEvent({
      title: String(body?.title || extracted?.title || ''),
      summary: String(body?.summary || extracted?.summary || ''),
      sourceUrl: sourceUrl || String(extracted?.sourceUrl || ''),
      organizer: typeof body?.organizer === 'string' ? body.organizer : extracted?.organizer || '',
      author: typeof body?.author === 'string' ? body.author : extracted?.author || '',
      eventDate: typeof body?.eventDate === 'string' ? body.eventDate : extracted?.eventDate || '',
      deadline: typeof body?.deadline === 'string' ? body.deadline : extracted?.deadline || '',
      location: typeof body?.location === 'string' ? body.location : extracted?.location || '',
      sourceLabel: typeof body?.sourceLabel === 'string' ? body.sourceLabel : extracted?.sourceLabel || '',
      tags: Array.isArray(body?.tags) ? body.tags : extracted?.tags || [],
      images: Array.isArray(body?.images) ? body.images : [],
      coverImage: typeof body?.coverImage === 'string' ? body.coverImage : extracted?.coverImage || '',
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
      message === 'duplicate-source-url' ||
      message === 'wechat-verification-required'
    ) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
