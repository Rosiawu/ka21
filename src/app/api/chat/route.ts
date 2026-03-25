import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL ||
  'https://api.deepseek.com/v1/chat/completions';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    name: 'chat-api',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: 'AI assistant is not configured' },
      { status: 503 }
    );
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(DEEPSEEK_API_URL);
    if (apiUrl.protocol !== 'https:') {
      throw new Error('invalid');
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid AI upstream configuration' },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const messages = body.messages
      .filter((message) => message && typeof message.role === 'string' && typeof message.content === 'string')
      .slice(-MAX_MESSAGES)
      .map((message) => ({
        role: message.role.slice(0, 20),
        content: message.content.trim().slice(0, MAX_MESSAGE_CHARS),
      }))
      .filter((message) => message.content);

    if (!messages.length) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const res = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream API error' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
