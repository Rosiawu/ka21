import { NextResponse } from 'next/server';
import { submitDeal } from '@/lib/deals/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitDeal({
      contributorId: String(body?.contributorId || ''),
      rawText: String(body?.rawText || ''),
      rawImages: Array.isArray(body?.rawImages) ? body.rawImages : [],
      supplementUrl: typeof body?.supplementUrl === 'string' ? body.supplementUrl : '',
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'submit-failed';
    const status = message === 'daily-submit-limit-exceeded' ? 429 : message === 'contributor-not-found' ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
