import { NextResponse } from 'next/server';
import { getDealById } from '@/lib/deals/store';

type DealRouteParams = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: DealRouteParams }) {
  try {
    const { id } = await params;
    const deal = await getDealById(id);
    if (!deal) {
      return NextResponse.json({ success: false, message: 'deal-not-found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'deal-fetch-failed' }, { status: 500 });
  }
}
