/**
 * @jest-environment node
 *
 * Tests for the same-origin API proxy.
 *
 * This route is the security boundary the single-droplet deployment rests on:
 * the API container publishes no port, so every browser call to it arrives
 * here. The properties asserted below are the ones whose loss would be quiet
 * and expensive — an unauthenticated caller getting through, a client-supplied
 * credential being forwarded upstream, or the server-side token leaking back
 * into a response.
 */

const mockGetLogtoContext = jest.fn();
// Two things about this mock are load-bearing:
//
//   virtual: true — the package's export map does not resolve under Jest's
//   CommonJS resolver, the same workaround the other logto route tests use.
//
//   the arrow wrapper around mockGetLogtoContext — the route constructs its
//   LogtoClient at module scope, which runs when the hoisted import executes,
//   before the const above is initialized. Referencing the mock directly here
//   reads it during construction and throws a TDZ error; calling it through a
//   wrapper defers the read until a test actually invokes the handler.
jest.mock(
  '@logto/next/edge',
  () =>
    jest.fn().mockImplementation(() => ({
      getLogtoContext: (...args: unknown[]) => mockGetLogtoContext(...args),
    })),
  { virtual: true }
);

jest.mock('@/lib/auth', () => ({
  logtoConfig: { endpoint: 'https://logto.test', appId: 'app' },
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockGetM2MToken = jest.fn();
jest.mock('@/lib/api/m2m-token', () => ({
  getM2MToken: () => mockGetM2MToken(),
}));

import { NextRequest } from 'next/server';
import { GET, POST, OPTIONS } from '../[...path]/route';

const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe('API proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TURING_API_INTERNAL_URL = 'http://api:8080';
    mockGetLogtoContext.mockResolvedValue({ isAuthenticated: true });
    mockGetM2MToken.mockResolvedValue('server-side-token');
    global.fetch = jest.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  it('checks the session without calling Logto over the network', async () => {
    // The whole point: this route needs one fact, "is there a valid session",
    // which comes from decrypting the cookie. Left at their defaults these
    // flags make getLogtoContext fetch userInfo and organization tokens from
    // Logto on EVERY proxied request -- and when one of those calls did not
    // complete it returned a bare {isAuthenticated: false}, rejecting a caller
    // whose session was demonstrably valid. Roughly one request per page load
    // lost that race. If these ever go back to their defaults, that returns.
    await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(mockGetLogtoContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fetchUserInfo: false,
        getAccessToken: false,
        getOrganizationToken: false,
      })
    );
  });

  it('rejects an unauthenticated caller without calling upstream', async () => {
    // Without this check the route is an open relay onto the internal API —
    // strictly worse than the public API it replaced.
    mockGetLogtoContext.mockResolvedValue({ isAuthenticated: false });

    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects when the authentication check itself throws', async () => {
    mockGetLogtoContext.mockRejectedValue(new Error('logto unreachable'));

    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards to the internal URL with the server-side token attached', async () => {
    await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://api:8080/projects');
    expect((init.headers as Headers).get('authorization')).toBe(
      'Bearer server-side-token'
    );
  });

  it('preserves the query string', async () => {
    await GET(
      new NextRequest('http://localhost/api/turing/projects?limit=10&cursor=x'),
      ctx(['projects'])
    );

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://api:8080/projects?limit=10&cursor=x');
  });

  it('drops a client-supplied Authorization header', async () => {
    // A caller must not be able to smuggle its own credential upstream; the
    // only credential that reaches the API is the one attached here.
    await GET(
      new NextRequest('http://localhost/api/turing/projects', {
        headers: { authorization: 'Bearer attacker-supplied' },
      }),
      ctx(['projects'])
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.headers as Headers).get('authorization')).toBe(
      'Bearer server-side-token'
    );
  });

  it('drops the session cookie rather than forwarding it', async () => {
    await GET(
      new NextRequest('http://localhost/api/turing/projects', {
        headers: { cookie: 'logto_session=abc' },
      }),
      ctx(['projects'])
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.headers as Headers).get('cookie')).toBeNull();
  });

  it('never returns the upstream token to the caller', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.headers.get('authorization')).toBeNull();
    expect(await res.text()).not.toContain('server-side-token');
  });

  it('returns 502 when the token cannot be obtained', async () => {
    mockGetM2MToken.mockRejectedValue(new Error('logto down'));

    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.status).toBe(502);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 502 when the upstream request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.status).toBe(502);
  });

  it('rejects traversal segments in the path', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects', '..', 'admin'])
    );

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards a request body for non-GET methods', async () => {
    await POST(
      new NextRequest('http://localhost/api/turing/projects', {
        method: 'POST',
        body: '{"name":"x"}',
      }),
      ctx(['projects'])
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    // duplex is required by undici whenever the body is a stream; without it
    // every request with a body throws before leaving the process.
    expect(init.duplex).toBe('half');
  });

  it('handles OPTIONS by forwarding, so tus capability discovery works', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: { 'tus-resumable': '1.0.0', 'tus-version': '1.0.0' },
      })
    );

    const res = await OPTIONS(
      new NextRequest('http://localhost/api/turing/projects/p1/files', {
        method: 'OPTIONS',
      }),
      ctx(['projects', 'p1', 'files'])
    );

    expect(global.fetch).toHaveBeenCalled();
    expect(res.headers.get('tus-resumable')).toBe('1.0.0');
  });

  it('marks server-sent event responses as unbuffered', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response('data: {}\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    );

    const res = await GET(
      new NextRequest('http://localhost/api/turing/p/training/j/stream'),
      ctx(['p', 'training', 'j', 'stream'])
    );

    expect(res.headers.get('x-accel-buffering')).toBe('no');
    expect(res.headers.get('cache-control')).toContain('no-cache');
  });

  it('returns 500 when the internal URL is not configured', async () => {
    delete process.env.TURING_API_INTERNAL_URL;

    const res = await GET(
      new NextRequest('http://localhost/api/turing/projects'),
      ctx(['projects'])
    );

    expect(res.status).toBe(500);
  });
});
