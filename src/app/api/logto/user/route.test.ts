/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// Mock LogtoClient
const mockHandleUser = jest.fn();

// Use virtual: true to avoid module resolution issues if the environment doesn't support the export map perfectly
jest.mock(
  '@logto/next/edge',
  () => {
    return jest.fn().mockImplementation(() => ({
      handleUser: () => mockHandleUser,
    }));
  },
  { virtual: true }
);

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock api-logger explicitly for clearer and more robust tests
jest.mock('@/lib/api-logger', () => ({
  logRequest: jest.fn(),
}));

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getRateLimitHeaders: jest.fn(),
}));

import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

describe('User API Route', () => {
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    if (originalNodeEnv) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getRateLimitHeaders as jest.Mock).mockReturnValue({});
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    });
  });

  const runTest = async (
    environment: 'development' | 'production',
    shouldHaveDebug: boolean
  ) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: environment,
      writable: true,
    });

    const mockUser = {
      isAuthenticated: true,
      claims: { sub: 'user-123' },
    };

    mockHandleUser.mockResolvedValue({
      json: async () => mockUser,
      status: 200,
    });

    const req = new NextRequest('http://localhost/api/logto/user');
    const res = await GET(req);
    const data = await res.json();

    if (shouldHaveDebug) {
      expect(data._debug).toBeDefined();
    } else {
      expect(data._debug).toBeUndefined();
    }
    expect(data.isAuthenticated).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  };

  it('should include _debug field in development', async () => {
    await runTest('development', true);
  });

  it('should NOT include _debug field in production', async () => {
    await runTest('production', false);
  });

  it('should set Cache-Control headers to prevent caching', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });

    const mockUser = {
      isAuthenticated: true,
      claims: { sub: 'user-123' },
    };

    mockHandleUser.mockResolvedValue({
      json: async () => mockUser,
      status: 200,
    });

    const req = new NextRequest('http://localhost/api/logto/user');
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });

  it('should block request when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest('http://localhost/api/logto/user');
    const res = await GET(req);

    expect(checkRateLimit).toHaveBeenCalled();
    expect(mockHandleUser).not.toHaveBeenCalled();
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      'User endpoint rate limit exceeded'
    );
  });
});
