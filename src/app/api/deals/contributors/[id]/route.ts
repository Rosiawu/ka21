import { NextResponse } from 'next/server';
import { getContributorProfile } from '@/lib/deals/store';

type ContributorRouteParams = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: ContributorRouteParams }) {
  try {
    const { id } = await params;
    const profile = await getContributorProfile(id);
    if (!profile) {
      return NextResponse.json({ success: false, message: 'contributor-not-found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'contributor-fetch-failed' }, { status: 500 });
  }
}
