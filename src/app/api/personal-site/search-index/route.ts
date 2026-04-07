import { NextResponse } from 'next/server';

import searchIndexData from '../../../../../public/personal-site/search-index.json';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(searchIndexData, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
