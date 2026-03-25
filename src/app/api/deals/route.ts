import { NextResponse } from 'next/server';
import { listApprovedDeals } from '@/lib/deals/store';

export async function GET() {
  try {
    const deals = await listApprovedDeals();
    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'deals-fetch-failed' }, { status: 500 });
  }
}
