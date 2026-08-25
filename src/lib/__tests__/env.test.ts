/**
 * Tests for environment variable validation
 */

import { getServerEnv, getClientEnv } from '../env';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getServerEnv', () => {
    it('should throw error when called on client side', () => {
      // Mock window to simulate client side
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};

      expect(() => getServerEnv()).toThrow(
        'getServerEnv() can only be called on the server side'
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
    });

    it('should parse valid server environment variables', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET: 'test-app-secret',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET: 'test-m2m-secret',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        NEXTAUTH_SECRET: 'this-is-a-very-long-secret-at-least-32-chars',
        TURING_API_INTERNAL_URL: 'http://api:8080',
        NODE_ENV: 'test',
      };

      const env = getServerEnv();

      expect(env.LOGTO_ENDPOINT).toBe('https://logto.example.com');
      expect(env.LOGTO_APP_ID).toBe('test-app-id');
      expect(env.TURING_API_INTERNAL_URL).toBe('http://api:8080');
      expect(env.NODE_ENV).toBe('test');
    });

    it('should throw error for missing required variables', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        // Missing other required variables
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });

    it('should throw error for invalid URL format', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'not-a-url',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET: 'test-app-secret',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET: 'test-m2m-secret',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        NEXTAUTH_SECRET: 'this-is-a-very-long-secret-at-least-32-chars',
        TURING_API_INTERNAL_URL: 'http://api:8080',
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });

    it('should throw error for short NEXTAUTH_SECRET', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET: 'test-app-secret',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET: 'test-m2m-secret',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        NEXTAUTH_SECRET: 'short', // Too short
        TURING_API_INTERNAL_URL: 'http://api:8080',
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });

    // The migration to Docker secrets means each secret arrives either as a
    // plain env var (local dev) or as <NAME>_FILE pointing at /run/secrets
    // (production). The schema accepts either, and requires at least one.
    it('should accept the _FILE variant of each secret', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET_FILE: '/run/secrets/LOGTO_APP_SECRET',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET_FILE: '/run/secrets/LOGTO_M2M_APP_SECRET',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        NEXTAUTH_SECRET_FILE: '/run/secrets/NEXTAUTH_SECRET',
        TURING_API_INTERNAL_URL: 'http://api:8080',
        NODE_ENV: 'test',
      };
      delete process.env.LOGTO_APP_SECRET;
      delete process.env.LOGTO_M2M_APP_SECRET;
      delete process.env.NEXTAUTH_SECRET;

      const env = getServerEnv();

      expect(env.LOGTO_APP_SECRET_FILE).toBe('/run/secrets/LOGTO_APP_SECRET');
      expect(env.NEXTAUTH_SECRET_FILE).toBe('/run/secrets/NEXTAUTH_SECRET');
    });

    it('should throw when a secret has neither the direct nor the _FILE form', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET: 'test-app-secret',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET: 'test-m2m-secret',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        TURING_API_INTERNAL_URL: 'http://api:8080',
      };
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET_FILE;

      expect(() => getServerEnv()).toThrow(
        /NEXTAUTH_SECRET or NEXTAUTH_SECRET_FILE must be set/
      );
    });

    it('should throw when TURING_API_INTERNAL_URL is missing', () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: 'https://logto.example.com',
        LOGTO_APP_ID: 'test-app-id',
        LOGTO_APP_SECRET: 'test-app-secret',
        LOGTO_M2M_APP_ID: 'test-m2m-id',
        LOGTO_M2M_APP_SECRET: 'test-m2m-secret',
        LOGTO_M2M_ENDPOINT: 'https://m2m.example.com',
        NEXTAUTH_URL: 'https://app.example.com',
        NEXTAUTH_SECRET: 'this-is-a-very-long-secret-at-least-32-chars',
      };
      delete process.env.TURING_API_INTERNAL_URL;

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });
  });

  describe('getClientEnv', () => {
    it('should parse valid client environment variables', () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_LOGTO_ENDPOINT: 'https://logto.example.com',
        NEXT_PUBLIC_LOGTO_APP_ID: 'test-app-id',
      };

      const env = getClientEnv();

      expect(env.NEXT_PUBLIC_LOGTO_ENDPOINT).toBe('https://logto.example.com');
      expect(env.NEXT_PUBLIC_LOGTO_APP_ID).toBe('test-app-id');
    });

    it('should throw error for missing client variables', () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_LOGTO_APP_ID: 'test-app-id',
        // Missing NEXT_PUBLIC_LOGTO_ENDPOINT
      };
      delete process.env.NEXT_PUBLIC_LOGTO_ENDPOINT;

      expect(() => getClientEnv()).toThrow(
        /Invalid or missing client environment variables/
      );
    });

    it('should throw error for invalid URL in client variables', () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_LOGTO_ENDPOINT: 'not-a-url',
        NEXT_PUBLIC_LOGTO_APP_ID: 'test-app-id',
      };

      expect(() => getClientEnv()).toThrow(
        /Invalid or missing client environment variables/
      );
    });
  });
});
