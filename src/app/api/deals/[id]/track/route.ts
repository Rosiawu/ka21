import { NextResponse } from 'next/server';
import { trackDealEvent } from '@/lib/deals/store';

type DealTrackRouteParams = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: DealTrackRouteParams }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const stats = await trackDealEvent({
      dealId: id,
      visitorId: String(body?.visitorId || ''),
      eventType: body?.eventType === 'source_click' ? 'source_click' : 'view',
    });
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'deal-track-failed' }, { status: 500 });
  }
}
