/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock LogtoClient
const mockHandleSignIn = jest.fn();

jest.mock('@logto/next/edge', () => {
  return jest.fn().mockImplementation(() => ({
    handleSignIn: () => mockHandleSignIn,
  }));
}, { virtual: true });

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

    mockHandleSignIn.mockResolvedValue(new Response('redirect', { status: 302 }));

    const req = new NextRequest('http://localhost/api/logto/sign-in');
    const res = await GET(req);

    expect(checkRateLimit).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      maxRequests: 20,
      windowMs: 60000,
      prefix: 'sign-in',
    }));
    expect(mockHandleSignIn).toHaveBeenCalled();
    expect(res.status).toBe(302);
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
