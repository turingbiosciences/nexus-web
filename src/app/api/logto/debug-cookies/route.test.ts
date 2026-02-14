/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    getAll: jest
      .fn()
      .mockReturnValue([{ name: 'test-cookie', value: 'secret-value' }]),
  })),
}));

describe('Debug Cookies Route', () => {
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
    const { GET } = await import('./route');

    // GET function signature for this route takes no args
    const res = await GET();

    expect(res.status).toBe(404);
  });

  it('should return 200 in development', async () => {
    process.env.NODE_ENV = 'development';
    const { GET } = await import('./route');

    const res = await GET();

    expect(res.status).toBe(200);
  });
});
