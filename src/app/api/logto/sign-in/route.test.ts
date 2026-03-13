/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock LogtoClient
const mockHandleSignIn = jest.fn();
const mockHandleSignInFactory = jest.fn(() => mockHandleSignIn);

jest.mock(
  '@logto/next/edge',
  () => {
    return jest.fn().mockImplementation(() => ({
      handleSignIn: (...args: any[]) => mockHandleSignInFactory(...args),
    }));
  },
  { virtual: true }
);

// Mock api-logger
jest.mock('@/lib/api-logger', () => ({
  logRequestWithResponse: jest.fn(),
}));

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getRateLimitHeaders: jest.fn(),
}));

import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

describe('Sign-in API Route', () => {
  const originalEnv = process.env.NEXTAUTH_URL;

  beforeAll(() => {
    process.env.NEXTAUTH_URL = 'http://localhost';
  });

  afterAll(() => {
    process.env.NEXTAUTH_URL = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getRateLimitHeaders as jest.Mock).mockReturnValue({});
  });

  it('should allow request when rate limit is not exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });

    mockHandleSignIn.mockResolvedValue(
      new Response('redirect', { status: 302 })
    );

    const req = new NextRequest('http://localhost/api/logto/sign-in');
    const res = await GET(req);

    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        maxRequests: 20,
        windowMs: 60000,
        prefix: 'sign-in',
      })
    );
    expect(mockHandleSignInFactory).toHaveBeenCalledWith(undefined);
    expect(res.status).toBe(302);
  });

  it('should pass safe redirect URI to LogtoClient', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({ success: true });
    mockHandleSignIn.mockResolvedValue(
      new Response('redirect', { status: 302 })
    );

    const req = new NextRequest(
      'http://localhost/api/logto/sign-in?redirect=/dashboard'
    );
    await GET(req);

    expect(mockHandleSignInFactory).toHaveBeenCalledWith('/dashboard');
  });

  it('should pass undefined for unsafe redirect URI', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({ success: true });
    mockHandleSignIn.mockResolvedValue(
      new Response('redirect', { status: 302 })
    );

    const req = new NextRequest(
      'http://localhost/api/logto/sign-in?redirect=https://evil.com'
    );
    await GET(req);

    expect(mockHandleSignInFactory).toHaveBeenCalledWith(undefined);
  });

  it('should block request when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest('http://localhost/api/logto/sign-in');
    const res = await GET(req);

    expect(checkRateLimit).toHaveBeenCalled();
    expect(mockHandleSignIn).not.toHaveBeenCalled();
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
