import { NextResponse } from 'next/server';
import { submitDevLog } from '@/lib/devlog/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await submitDevLog({
      title: String(body?.title || ''),
      body: String(body?.body || ''),
      author: typeof body?.author === 'string' ? body.author : '',
      images: Array.isArray(body?.images) ? body.images : [],
    });
    return NextResponse.json({
      success: true,
      data: entry,
      message: '已写入 GitHub，等待自动部署完成后即可在开发日志页看到。',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'submit-failed';
    const status = message.startsWith('missing-') || message === 'invalid-image-data-url' ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
