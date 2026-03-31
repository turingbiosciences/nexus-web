/** @jest-environment node */
import { NextRequest } from 'next/server';
import { NO_CACHE_HEADERS } from '@/lib/http-headers';

// We need to define mocks before imports
jest.mock(
  '@logto/next/edge',
  () => {
    return jest.fn().mockImplementation(() => {
      return {
        // Default to authenticated for all tests
        getLogtoContext: jest.fn().mockResolvedValue({ isAuthenticated: true }),
        handleSignIn: jest.fn(),
        handleSignOut: jest.fn(),
        handleSignInCallback: jest.fn(),
      };
    });
  },
  { virtual: true }
);

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getRateLimitHeaders: jest.fn(),
}));

describe('Token API Route Security Test', () => {
  const originalEnv = process.env;
  let GET: (req: NextRequest) => Promise<Response>;
  let mockLogger: any;
  let checkRateLimit: any;
  let getRateLimitHeaders: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env = { ...originalEnv };
    process.env.LOGTO_ENDPOINT = 'https://logto.example.com';
    process.env.LOGTO_M2M_APP_ID = 'test-app-id';
    process.env.LOGTO_M2M_APP_SECRET = 'test-app-secret';
    process.env.LOGTO_M2M_ENDPOINT = 'https://api.example.com';

    // Re-require modules
    const rateLimit = require('@/lib/rate-limit');
    checkRateLimit = rateLimit.checkRateLimit;
    getRateLimitHeaders = rateLimit.getRateLimitHeaders;

    checkRateLimit.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    getRateLimitHeaders.mockReturnValue({});

    mockLogger = require('@/lib/logger').logger;

    // Load route (this triggers new LogtoClient)
    const routeModule = require('./route');
    GET = routeModule.GET;

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'mock-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should set Cache-Control headers to prevent caching on success', async () => {
    const req = new NextRequest('http://localhost/api/logto/token');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe(NO_CACHE_HEADERS);
  });

  it('should not leak sensitive upstream error details in Error message', async () => {
    const sensitiveError = 'sensitive-api-key-leaked';

    // Mock upstream fetch failure with sensitive info
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => `Invalid request: ${sensitiveError}`,
    });

    const req = new NextRequest('http://localhost/api/logto/token');
    await GET(req);

    // Verify logger.error was called with the detailed error object (which Pino redacts)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        errorText: expect.stringContaining(sensitiveError),
      }),
      'Token fetch failed'
    );

    // Verify the thrown error caught in the catch block
    const catchErrorCall = mockLogger.error.mock.calls.find(
      (call: any[]) => call[1] === 'M2M token request failed'
    );
    expect(catchErrorCall).toBeDefined();

    const loggedError = catchErrorCall[0].error;

    expect(loggedError.message).not.toContain(sensitiveError);
  });
});
