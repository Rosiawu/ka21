import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '@/lib/security/admin';

const TUTORIAL_ACCESS_COOKIE_NAME = 'ka21_tutorial_access';
const TUTORIAL_ACCESS_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_TUTORIAL_ACCESS_PASSWORD = 'ka21';
const DEFAULT_TUTORIAL_ACCESS_SECRET = 'ka21-tutorial-access';

type TutorialAccessSessionPayload = {
  sub: 'tutorial-import';
  iat: number;
  exp: number;
};

type TutorialAccessState = {
  authenticated: boolean;
  protectionEnabled: boolean;
};

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getTutorialAccessPassword() {
  return process.env.KA21_TUTORIAL_ACCESS_PASSWORD || DEFAULT_TUTORIAL_ACCESS_PASSWORD;
}

function getTutorialAccessSecret() {
  return (
    process.env.KA21_TUTORIAL_ACCESS_SECRET ||
    process.env.KA21_ADMIN_SESSION_SECRET ||
    DEFAULT_TUTORIAL_ACCESS_SECRET
  );
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(encodedPayload: string, secret: string) {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function createSessionToken(secret: string) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: TutorialAccessSessionPayload = {
    sub: 'tutorial-import',
    iat: nowSeconds,
    exp: nowSeconds + TUTORIAL_ACCESS_TTL_SECONDS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf('=');
        if (separatorIndex === -1) {
          return [item, ''] as const;
        }

        return [
          item.slice(0, separatorIndex).trim(),
          decodeURIComponent(item.slice(separatorIndex + 1).trim()),
        ] as const;
      }),
  );
}

function getSessionTokenFromRequest(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  return cookies.get(TUTORIAL_ACCESS_COOKIE_NAME) || '';
}

function readSession(token: string, secret: string) {
  if (!token || !secret) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as TutorialAccessSessionPayload;
    if (
      payload?.sub !== 'tutorial-import' ||
      !payload?.exp ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function hasValidTutorialAccess(request: Request) {
  const secret = getTutorialAccessSecret();
  return Boolean(readSession(getSessionTokenFromRequest(request), secret));
}

export function getTutorialAccessState(request: Request): TutorialAccessState {
  return {
    authenticated: hasAdminAccess(request) || hasValidTutorialAccess(request),
    protectionEnabled: true,
  };
}

export function validateTutorialAccessPassword(password: string) {
  if (!safeEqual(password, getTutorialAccessPassword())) {
    return { ok: false, reason: 'invalid-tutorial-access-password' as const };
  }

  return { ok: true, reason: null as null };
}

export function createTutorialAccessResponse() {
  const token = createSessionToken(getTutorialAccessSecret());
  const response = NextResponse.json({
    success: true,
    data: {
      authenticated: true,
      protectionEnabled: true,
    },
  });

  response.cookies.set({
    name: TUTORIAL_ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
    maxAge: TUTORIAL_ACCESS_TTL_SECONDS,
  });

  return response;
}

export function clearTutorialAccessResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: TUTORIAL_ACCESS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
    maxAge: 0,
  });
  return response;
}

export function requireTutorialImportAccess(request: Request) {
  if (hasAdminAccess(request) || hasValidTutorialAccess(request)) {
    return null;
  }

  return NextResponse.json(
    { success: false, message: 'tutorial-access-required' },
    { status: 401 },
  );
}
