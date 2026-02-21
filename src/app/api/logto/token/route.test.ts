/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@logto/next/edge', () => {
  return jest.fn().mockImplementation(() => ({
    getLogtoContext: jest.fn().mockResolvedValue({
      isAuthenticated: true,
    }),
  }));
}, { virtual: true });

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true }),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

// Mock logger to suppress output
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe('GET /api/logto/token', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      LOGTO_ENDPOINT: 'http://logto.test',
      LOGTO_M2M_APP_ID: 'test-app-id',
      LOGTO_M2M_APP_SECRET: 'test-app-secret',
      LOGTO_M2M_ENDPOINT: 'http://api.test',
      NODE_ENV: 'test',
    };
  });

  it('should include Cache-Control: no-store header', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    const req = new NextRequest('http://localhost/api/logto/token');
    // Mock headers for rate limiting
    req.headers.set('x-forwarded-for', '127.0.0.1');

    const res = await GET(req);

    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toBe('no-store');
  });
});
