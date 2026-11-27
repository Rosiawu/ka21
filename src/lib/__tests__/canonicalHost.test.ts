import { getCanonicalRedirectTarget, resolvePublicProtocol, selectPublicHostname } from '../canonicalHost';

describe('canonical host redirect', () => {
  test('leaves the https apex URL in place', () => {
    expect(getCanonicalRedirectTarget({
      protocol: 'https:',
      hostname: 'ka21.org',
      pathname: '/zh',
      search: '',
    })).toBeNull();
  });

  test('redirects www and http to the https apex and keeps the path', () => {
    expect(getCanonicalRedirectTarget({
      protocol: 'https:',
      hostname: 'www.ka21.org',
      pathname: '/zh',
    })).toBe('https://ka21.org/zh');

    expect(getCanonicalRedirectTarget({
      protocol: 'http:',
      hostname: 'ka21.org',
      pathname: '/en/devlog',
      search: '?utm=1',
    })).toBe('https://ka21.org/en/devlog?utm=1');

    expect(getCanonicalRedirectTarget({
      protocol: 'http:',
      hostname: 'www.ka21.org',
      pathname: '/personal-site/',
      cfVisitor: '{"scheme":"http"}',
    })).toBe('https://ka21.org/personal-site/');
  });

  test('does not redirect local or preview hosts', () => {
    expect(getCanonicalRedirectTarget({
      protocol: 'http:',
      hostname: 'localhost',
      pathname: '/zh',
    })).toBeNull();
    expect(getCanonicalRedirectTarget({
      protocol: 'https:',
      hostname: 'ka21-tools.workers.dev',
      pathname: '/',
    })).toBeNull();
  });

  test('prefers the public ka21 host over an internal bind host', () => {
    expect(selectPublicHostname([
      'ka21.org',
      'www.ka21.org:443',
    ])).toBe('www.ka21.org');
    expect(selectPublicHostname([
      'ka21-tools.workers.dev',
      'www.ka21.org:443',
      'localhost:3000',
    ])).toBe('www.ka21.org');
    expect(selectPublicHostname(['127.0.0.1:3456'])).toBe('127.0.0.1');
  });

  test('trusts the visitor scheme when Cloudflare reports http', () => {
    expect(resolvePublicProtocol({
      protocol: 'https:',
      forwardedProto: 'https',
      cfVisitor: '{"scheme":"http"}',
    })).toBe('http');
  });
});
