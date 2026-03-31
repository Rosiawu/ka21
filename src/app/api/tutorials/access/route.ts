import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  clearTutorialAccessResponse,
  createTutorialAccessResponse,
  getTutorialAccessState,
  validateTutorialAccessPassword,
} from '@/lib/security/tutorial-access';

export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    data: getTutorialAccessState(request),
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, {
    name: 'tutorial-access-login',
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';
    const validation = validateTutorialAccessPassword(password);

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, message: validation.reason },
        { status: 401 },
      );
    }

    return createTutorialAccessResponse();
  } catch {
    return NextResponse.json(
      { success: false, message: 'invalid-request-body' },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  return clearTutorialAccessResponse();
}
