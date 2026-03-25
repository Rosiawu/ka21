import { NextResponse } from 'next/server';
import { extractDealPreview } from '@/lib/deals/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await extractDealPreview({
      rawText: String(body?.rawText || ''),
      rawImages: Array.isArray(body?.rawImages) ? body.rawImages : [],
      supplementUrl: typeof body?.supplementUrl === 'string' ? body.supplementUrl : '',
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'extract-failed' }, { status: 500 });
  }
}
