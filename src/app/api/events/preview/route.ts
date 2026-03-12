import { NextResponse } from 'next/server';
import { extractEventFromSourceUrl } from '@/lib/events/extractor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceUrl = String(body?.sourceUrl || '').trim();
    if (!sourceUrl) {
      return NextResponse.json({ success: false, message: 'missing-source-url' }, { status: 400 });
    }

    const data = await extractEventFromSourceUrl(sourceUrl);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'preview-failed';
    const status = (
      message === 'invalid-source-url' ||
      message === 'wechat-verification-required' ||
      message === 'extract-title-failed'
    ) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
