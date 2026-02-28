/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock LogtoClient
const mockGetLogtoContext = jest.fn();

jest.mock('@logto/next/edge', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getLogtoContext: (...args: any[]) => mockGetLogtoContext(...args),
    };
  });
}, { virtual: true });

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true }),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

describe('Token API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
    process.env.LOGTO_ENDPOINT = 'https://logto.example.com';
    process.env.LOGTO_M2M_APP_ID = 'test-m2m-app';
    process.env.LOGTO_M2M_APP_SECRET = 'test-m2m-secret';
    process.env.LOGTO_M2M_ENDPOINT = 'https://api.example.com';
  });

  it('should set Cache-Control headers to prevent caching on success', async () => {
    mockGetLogtoContext.mockResolvedValue({ isAuthenticated: true });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'mock-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    const req = new NextRequest('http://localhost/api/logto/token');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });
});
