import { NextResponse } from 'next/server';
import { getSortedEvents } from '@/data/events';

export async function GET() {
  try {
    const events = await getSortedEvents();
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'events-fetch-failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
