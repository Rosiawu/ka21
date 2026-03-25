import { NextResponse } from 'next/server';
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
  getAdminSessionState,
  validateAdminCredentials,
} from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function GET(request: Request) {
  const state = getAdminSessionState(request);
  return NextResponse.json({ success: true, data: state });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, {
    name: 'admin-session-login',
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const validation = validateAdminCredentials(username, password);

    if (!validation.ok) {
      const status = validation.reason === 'interactive-admin-auth-unavailable' ? 503 : 401;
      return NextResponse.json(
        { success: false, message: validation.reason },
        { status },
      );
    }

    return createAdminSessionResponse(username);
  } catch {
    return NextResponse.json(
      { success: false, message: 'invalid-request-body' },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  return clearAdminSessionResponse();
}
