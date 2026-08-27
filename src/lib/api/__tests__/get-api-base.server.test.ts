/**
 * @jest-environment node
 *
 * Tests for get-api-base utility — SERVER behaviour.
 *
 * Separate file rather than a separate describe block: getApiBaseUrl() picks
 * its branch on `typeof window`, so the two halves need different Jest
 * environments. The client half lives in get-api-base.test.ts.
 */

import { getApiBaseUrl } from '../get-api-base';

describe('getApiBaseUrl (server)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it.each([
    ['no trailing slash', 'http://api:8080'],
    ['one trailing slash', 'http://api:8080/'],
    ['several trailing slashes', 'http://api:8080///'],
  ])('returns the internal API URL with %s', (_label, configured) => {
    process.env.TURING_API_INTERNAL_URL = configured;

    expect(getApiBaseUrl()).toBe('http://api:8080');
  });

  it('preserves URL path segments', () => {
    process.env.TURING_API_INTERNAL_URL = 'http://api:8080/v1/api';

    expect(getApiBaseUrl()).toBe('http://api:8080/v1/api');
  });

  it('throws when TURING_API_INTERNAL_URL is not set', () => {
    delete process.env.TURING_API_INTERNAL_URL;

    expect(() => getApiBaseUrl()).toThrow(
      'Missing TURING_API_INTERNAL_URL environment variable'
    );
  });

  it('throws when TURING_API_INTERNAL_URL is an empty string', () => {
    process.env.TURING_API_INTERNAL_URL = '';

    expect(() => getApiBaseUrl()).toThrow(
      'Missing TURING_API_INTERNAL_URL environment variable'
    );
  });
});
