import { NextResponse } from 'next/server';
import { bindContributor } from '@/lib/deals/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contributor = await bindContributor({
      contributorId: typeof body?.contributorId === 'string' ? body.contributorId : '',
      nickname: String(body?.nickname || ''),
      avatarUrl: typeof body?.avatarUrl === 'string' ? body.avatarUrl : '',
      bio: typeof body?.bio === 'string' ? body.bio : '',
      openid: typeof body?.openid === 'string' ? body.openid : '',
      unionid: typeof body?.unionid === 'string' ? body.unionid : '',
    });
    return NextResponse.json({ success: true, data: contributor });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'bind-failed' }, { status: 500 });
  }
}
