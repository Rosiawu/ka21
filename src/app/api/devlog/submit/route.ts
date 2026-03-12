import { NextResponse } from 'next/server';
import { submitDevLog } from '@/lib/devlog/store';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: {
      title: string;
      body: string;
      author?: string;
      images?: string[];
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('images').filter((item): item is File => item instanceof File);
      const images = await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const mimeType = file.type || 'image/jpeg';
          return `data:${mimeType};base64,${buffer.toString('base64')}`;
        })
      );
      payload = {
        title: String(formData.get('title') || ''),
        body: String(formData.get('body') || ''),
        author: String(formData.get('author') || ''),
        images,
      };
    } else {
      const body = await request.json();
      payload = {
        title: String(body?.title || ''),
        body: String(body?.body || ''),
        author: typeof body?.author === 'string' ? body.author : '',
        images: Array.isArray(body?.images) ? body.images : [],
      };
    }

    const entry = await submitDevLog({
      title: payload.title,
      body: payload.body,
      author: payload.author,
      images: payload.images,
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
