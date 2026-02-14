/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock(
  '@logto/next/edge',
  () => {
    return jest.fn().mockImplementation(() => ({
      handleUser: jest.fn().mockReturnValue(
        async () =>
          new Response(
            JSON.stringify({
              isAuthenticated: true,
              claims: { sub: 'test-sub' },
            })
          )
      ),
    }));
  },
  { virtual: true }
);

jest.mock('@/lib/auth', () => ({
  logtoConfig: {},
}));

jest.mock('@/lib/api/get-api-base', () => ({
  getApiBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
}));

describe('Debug Token Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 404 in production', async () => {
    process.env.NODE_ENV = 'production';
    // Dynamic import to pick up the new NODE_ENV
    const { GET } = await import('./route');

    const req = new NextRequest('http://localhost:3000/api/debug/token');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('should return 200 in development', async () => {
    process.env.NODE_ENV = 'development';
    // Dynamic import to pick up the new NODE_ENV
    const { GET } = await import('./route');

    const req = new NextRequest('http://localhost:3000/api/debug/token');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
