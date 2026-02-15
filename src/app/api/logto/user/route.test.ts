/** @jest-environment node */
import { GET } from './route';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// Mock LogtoClient
const mockHandleUser = jest.fn();

// Use virtual: true to avoid module resolution issues if the environment doesn't support the export map perfectly
jest.mock('@logto/next/edge', () => {
  return jest.fn().mockImplementation(() => ({
    handleUser: () => mockHandleUser,
  }));
}, { virtual: true });

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('User API Route', () => {
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include _debug field in development', async () => {
    process.env.NODE_ENV = 'development';

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

    expect(data._debug).toBeDefined();
    expect(data.isAuthenticated).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  });

  it('should NOT include _debug field in production', async () => {
    process.env.NODE_ENV = 'production';

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

    expect(data._debug).toBeUndefined();
    expect(data.isAuthenticated).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  });
});
