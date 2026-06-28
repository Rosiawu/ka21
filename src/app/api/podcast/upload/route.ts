import { NextResponse } from 'next/server';
import { submitPodcastEpisode } from '@/lib/podcast-upload/store';
import { requireAdminAccess } from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const MAX_AUDIO_BYTES = 90 * 1024 * 1024;
const MAX_COVER_BYTES = 8 * 1024 * 1024;
const MAX_SHOWNOTES_CHARS = 30_000;

function isAudioFile(file: File) {
  return file.type.startsWith('audio/') || file.type === 'video/mp4' || /\.(mp3|m4a|aac|wav|flac)$/i.test(file.name);
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
}

async function fileToBase64(file: File) {
  return Buffer.from(await file.arrayBuffer()).toString('base64');
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

function boolValue(formData: FormData, key: string) {
  return ['1', 'true', 'yes', 'on'].includes(String(formData.get(key) || '').toLowerCase());
}

export async function POST(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'podcast-upload',
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const formData = await request.formData();
    const audio = formData.get('audio');
    const cover = formData.get('cover');
    const shownotesFile = formData.get('shownotesFile');
    const shownotesText = stringValue(formData, 'shownotesText');

    if (!(audio instanceof File) || !audio.size) {
      throw new Error('missing-audio');
    }
    if (!(cover instanceof File) || !cover.size) {
      throw new Error('missing-cover');
    }
    if (!isAudioFile(audio)) {
      throw new Error('invalid-audio');
    }
    if (!isImageFile(cover)) {
      throw new Error('invalid-cover');
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      throw new Error('audio-too-large');
    }
    if (cover.size > MAX_COVER_BYTES) {
      throw new Error('cover-too-large');
    }

    let shownotes = shownotesText;
    if (shownotesFile instanceof File && shownotesFile.size) {
      if (shownotesFile.size > MAX_SHOWNOTES_CHARS * 4) {
        throw new Error('shownotes-too-large');
      }
      shownotes = Buffer.from(await shownotesFile.arrayBuffer()).toString('utf-8');
    }
    shownotes = shownotes.trim().slice(0, MAX_SHOWNOTES_CHARS);
    if (!shownotes) {
      throw new Error('missing-shownotes');
    }

    const result = await submitPodcastEpisode({
      title: stringValue(formData, 'title'),
      subtitle: stringValue(formData, 'subtitle'),
      slug: stringValue(formData, 'slug'),
      pubDate: stringValue(formData, 'pubDate'),
      episodeNumber: stringValue(formData, 'episodeNumber'),
      season: stringValue(formData, 'season'),
      explicit: boolValue(formData, 'explicit'),
      shownotes,
      audio: {
        fileName: audio.name,
        mimeType: audio.type || 'audio/mpeg',
        bytes: audio.size,
        base64: await fileToBase64(audio),
      },
      cover: {
        fileName: cover.name,
        mimeType: cover.type || 'image/jpeg',
        bytes: cover.size,
        base64: await fileToBase64(cover),
      },
    });

    return NextResponse.json({
      success: true,
      message: '播客单集已写入 GitHub。等待牛马库自动部署完成后，公网 RSS 会更新。',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'podcast-upload-failed';
    const status = [
      'missing-title',
      'missing-audio',
      'missing-cover',
      'missing-shownotes',
      'invalid-audio',
      'invalid-cover',
      'audio-too-large',
      'cover-too-large',
      'shownotes-too-large',
    ].includes(message)
      ? 400
      : 500;

    return NextResponse.json({ success: false, message }, { status });
  }
}
