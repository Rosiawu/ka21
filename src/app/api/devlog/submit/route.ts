import { NextResponse } from 'next/server';
import { submitDevLog } from '@/lib/devlog/store';
import { requireAdminAccess } from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const MAX_SINGLE_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 18 * 1024 * 1024;
const MAX_TITLE_CHARS = 80;
const MAX_BODY_CHARS = 6_000;

export async function POST(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'devlog-submit',
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
      let totalBytes = 0;
      const images = await Promise.all(
        files.map(async (file) => {
          if (file.size > MAX_SINGLE_IMAGE_BYTES) {
            throw new Error('image-too-large');
          }
          totalBytes += file.size;
          if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
            throw new Error('images-total-too-large');
          }
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

    payload = {
      title: payload.title.trim().slice(0, MAX_TITLE_CHARS),
      body: payload.body.trim().slice(0, MAX_BODY_CHARS),
      author: (payload.author || '').trim().slice(0, 20),
      images: Array.isArray(payload.images) ? payload.images.slice(0, 9) : [],
    };

    if (!payload.title) {
      throw new Error('missing-title');
    }

    if (!payload.body) {
      throw new Error('missing-body');
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
    const status =
      message.startsWith('missing-') ||
      message === 'invalid-image-data-url' ||
      message === 'image-too-large' ||
      message === 'images-total-too-large'
        ? 400
        : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
