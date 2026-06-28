import { NextResponse } from 'next/server';
import { proxyAdminRequest, shouldProxyAdminRequest } from '@/lib/admin-proxy';
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
  getAdminSessionState,
  validateAdminCredentials,
} from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function GET(request: Request) {
  if (shouldProxyAdminRequest(request)) {
    return proxyAdminRequest(request, '/api/admin/session');
  }

  const state = getAdminSessionState(request);
  return NextResponse.json({ success: true, data: state });
}

export async function POST(request: Request) {
  if (shouldProxyAdminRequest(request)) {
    return proxyAdminRequest(request, '/api/admin/session');
  }

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

export async function DELETE(request: Request) {
  if (shouldProxyAdminRequest(request)) {
    return proxyAdminRequest(request, '/api/admin/session');
  }

  return clearAdminSessionResponse();
}
