import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'ka21_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

type AdminAuthConfig = {
  username: string;
  password: string;
  sessionSecret: string;
  bearerToken: string;
  interactiveAvailable: boolean;
  protectionEnabled: boolean;
};

type AdminSessionState = {
  authenticated: boolean;
  interactiveAvailable: boolean;
  protectionEnabled: boolean;
  mode: 'development-open' | 'interactive' | 'bearer-only' | 'disabled';
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

function getAuthConfig(): AdminAuthConfig {
  const username = (process.env.KA21_ADMIN_USERNAME || '').trim();
  const password = process.env.KA21_ADMIN_PASSWORD || '';
  const sessionSecret = process.env.KA21_ADMIN_SESSION_SECRET || '';
  const bearerToken = process.env.KA21_ADMIN_BEARER_TOKEN || '';
  const interactiveAvailable = Boolean(username && password && sessionSecret);
  const protectionEnabled = interactiveAvailable || Boolean(bearerToken);

  return {
    username,
    password,
    sessionSecret,
    bearerToken,
    interactiveAvailable,
    protectionEnabled,
  };
}

function shouldBypassInLocalDevelopment(config = getAuthConfig()) {
  return !isProduction() && !config.protectionEnabled;
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

function createSessionToken(username: string, sessionSecret: string) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_TTL_SECONDS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, sessionSecret);
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
  return cookies.get(SESSION_COOKIE_NAME) || '';
}

function readSession(token: string, sessionSecret: string): SessionPayload | null {
  if (!token || !sessionSecret) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, sessionSecret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
    if (!payload?.sub || !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function hasValidBearerToken(request: Request, config: AdminAuthConfig) {
  if (!config.bearerToken) {
    return false;
  }

  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return Boolean(match?.[1] && safeEqual(match[1], config.bearerToken));
}

function hasValidSession(request: Request, config: AdminAuthConfig) {
  if (!config.interactiveAvailable) {
    return false;
  }
  return Boolean(readSession(getSessionTokenFromRequest(request), config.sessionSecret));
}

function buildUnauthorizedResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: status === 401 ? { 'WWW-Authenticate': 'Bearer realm="ka21-admin"' } : undefined,
    },
  );
}

export function getAdminSessionState(request: Request): AdminSessionState {
  const config = getAuthConfig();

  if (shouldBypassInLocalDevelopment(config)) {
    return {
      authenticated: true,
      interactiveAvailable: true,
      protectionEnabled: false,
      mode: 'development-open',
    };
  }

  const authenticated = hasValidSession(request, config) || hasValidBearerToken(request, config);
  if (config.interactiveAvailable) {
    return {
      authenticated,
      interactiveAvailable: true,
      protectionEnabled: true,
      mode: 'interactive',
    };
  }

  if (config.protectionEnabled) {
    return {
      authenticated,
      interactiveAvailable: false,
      protectionEnabled: true,
      mode: 'bearer-only',
    };
  }

  return {
    authenticated: false,
    interactiveAvailable: false,
    protectionEnabled: false,
    mode: 'disabled',
  };
}

export function requireAdminAccess(request: Request) {
  const config = getAuthConfig();

  if (shouldBypassInLocalDevelopment(config)) {
    return null;
  }

  if (hasValidSession(request, config) || hasValidBearerToken(request, config)) {
    return null;
  }

  if (!config.protectionEnabled) {
    return buildUnauthorizedResponse('admin-auth-not-configured', 503);
  }

  return buildUnauthorizedResponse('admin-auth-required', 401);
}

export function validateAdminCredentials(username: string, password: string) {
  const config = getAuthConfig();
  if (!config.interactiveAvailable) {
    return { ok: false, reason: 'interactive-admin-auth-unavailable' as const, config };
  }

  if (!safeEqual(username, config.username) || !safeEqual(password, config.password)) {
    return { ok: false, reason: 'invalid-admin-credentials' as const, config };
  }

  return { ok: true, reason: null, config };
}

export function createAdminSessionResponse(username: string) {
  const config = getAuthConfig();
  if (!config.interactiveAvailable) {
    return buildUnauthorizedResponse('interactive-admin-auth-unavailable', 503);
  }

  const token = createSessionToken(username, config.sessionSecret);
  const response = NextResponse.json({
    success: true,
    data: {
      authenticated: true,
      interactiveAvailable: true,
      mode: shouldBypassInLocalDevelopment(config) ? 'development-open' : 'interactive',
    },
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
    maxAge: 0,
  });
  return response;
}
