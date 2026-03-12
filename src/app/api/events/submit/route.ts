import { NextResponse } from 'next/server';
import { submitEvent } from '@/lib/events/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await submitEvent({
      title: String(body?.title || ''),
      summary: String(body?.summary || ''),
      sourceUrl: String(body?.sourceUrl || ''),
      organizer: typeof body?.organizer === 'string' ? body.organizer : '',
      author: typeof body?.author === 'string' ? body.author : '',
      eventDate: typeof body?.eventDate === 'string' ? body.eventDate : '',
      deadline: typeof body?.deadline === 'string' ? body.deadline : '',
      location: typeof body?.location === 'string' ? body.location : '',
      sourceLabel: typeof body?.sourceLabel === 'string' ? body.sourceLabel : '',
      tags: Array.isArray(body?.tags) ? body.tags : [],
      images: Array.isArray(body?.images) ? body.images : [],
    });
    return NextResponse.json({
      success: true,
      data: entry,
      message: '已写入赛事区，等待自动部署完成后即可在赛事页看到。',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'submit-failed';
    const status = message.startsWith('missing-') || message === 'invalid-image-data-url' ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
