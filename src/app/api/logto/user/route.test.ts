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

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true }),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

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
});
