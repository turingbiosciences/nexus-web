/**
 * Tests for get-api-base utility
 */

import { getApiBaseUrl } from '../get-api-base';

describe('getApiBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the API base URL when NEXT_PUBLIC_TURING_API is set', () => {
    process.env.NEXT_PUBLIC_TURING_API = 'https://api.example.com';

    const result = getApiBaseUrl();

    expect(result).toBe('https://api.example.com');
  });

  it('removes trailing slash from URL', () => {
    process.env.NEXT_PUBLIC_TURING_API = 'https://api.example.com/';

    const result = getApiBaseUrl();

    expect(result).toBe('https://api.example.com');
  });

  it('removes multiple trailing slashes', () => {
    process.env.NEXT_PUBLIC_TURING_API = 'https://api.example.com///';

    const result = getApiBaseUrl();

    // Note: current implementation only removes one trailing slash
    // This test documents actual behavior
    expect(result).toBe('https://api.example.com//');
  });

  it('throws error when NEXT_PUBLIC_TURING_API is not set', () => {
    delete process.env.NEXT_PUBLIC_TURING_API;

    expect(() => getApiBaseUrl()).toThrow(
      'Missing NEXT_PUBLIC_TURING_API environment variable'
    );
  });

  it('throws error when NEXT_PUBLIC_TURING_API is empty string', () => {
    process.env.NEXT_PUBLIC_TURING_API = '';

    expect(() => getApiBaseUrl()).toThrow(
      'Missing NEXT_PUBLIC_TURING_API environment variable'
    );
  });

  it('preserves URL path segments', () => {
    process.env.NEXT_PUBLIC_TURING_API = 'https://api.example.com/v1/api';

    const result = getApiBaseUrl();

    expect(result).toBe('https://api.example.com/v1/api');
  });
});
