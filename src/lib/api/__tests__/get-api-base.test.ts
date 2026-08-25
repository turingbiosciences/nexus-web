/**
 * Tests for get-api-base utility — CLIENT behaviour.
 *
 * This file runs under the default jsdom environment, so `window` is defined
 * and getApiBaseUrl() takes its client branch. The server branch is covered in
 * get-api-base.server.test.ts, which opts into the node environment; the two
 * cannot share a file because the branch is chosen by `typeof window`.
 */

import { getApiBaseUrl } from '../get-api-base';

describe('getApiBaseUrl (client)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the same-origin proxy path', () => {
    expect(getApiBaseUrl()).toBe('/api/turing');
  });

  it('does not depend on any environment variable', () => {
    // The point of the proxy is that the browser bundle carries no API address.
    delete process.env.TURING_API_INTERNAL_URL;

    expect(() => getApiBaseUrl()).not.toThrow();
    expect(getApiBaseUrl()).toBe('/api/turing');
  });

  it('ignores TURING_API_INTERNAL_URL even when it is set', () => {
    // Guards against a regression where the internal address leaks to the
    // browser, which would republish the API's location.
    process.env.TURING_API_INTERNAL_URL = 'http://api:8080';

    expect(getApiBaseUrl()).toBe('/api/turing');
  });
});
