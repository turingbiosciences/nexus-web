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
  },
}));

// Mock api-logger explicitly for clearer and more robust tests
jest.mock('@/lib/api-logger', () => ({
  logRequest: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true }),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}));
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { NO_CACHE_HEADERS } from '@/lib/http-headers';

/**
 * Set NODE_ENV for the duration of a test.
 *
 * Plain assignment, not a property definition: as of Node 20+ (verified on
 * v24) defining NODE_ENV on `process.env` is silently ignored — the descriptor
 * updates but the value the env store returns does not, so the route under
 * test kept seeing NODE_ENV='test' and never emitted _debug. Assignment goes
 * through the setter that actually writes it. The cast is needed because Next
 * narrows process.env.NODE_ENV to a literal union.
 */
const setNodeEnv = (value: string | undefined) => {
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
  } else {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  }
};

describe('User API Route', () => {
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    setNodeEnv(originalNodeEnv);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({ success: true });
    (getRateLimitHeaders as jest.Mock).mockReturnValue({});
  });

  const runTest = async (
    environment: 'development' | 'production',
    shouldHaveDebug: boolean
  ) => {
    setNodeEnv(environment);

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
    setNodeEnv('production');

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

    expect(res.headers.get('Cache-Control')).toBe(NO_CACHE_HEADERS);
  });

  it('should return 429 when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    (getRateLimitHeaders as jest.Mock).mockReturnValue({
      'Retry-After': '60',
    });

    const req = new NextRequest('http://localhost/api/logto/user');
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');

    const data = await res.json();
    expect(data.error).toBe('Too many requests. Please try again later.');
  });
});
