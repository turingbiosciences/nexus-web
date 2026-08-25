/**
 * Fetch wrapper for calls to the API, with session-expiry handling.
 *
 * These requests go to the same-origin /api/turing/* proxy, which attaches
 * credentials server-side. There is no token to pass in and none to refresh
 * here — the proxy obtains a fresh one per request. What the client still has
 * to handle is its own Logto *session* expiring, which surfaces as a 401 from
 * the proxy's authentication check; the only recovery is to sign in again.
 */

import { logger } from './logger';

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Fetch an API path through the proxy, redirecting to sign-out if the session
 * is no longer valid.
 *
 * `credentials: 'include'` is what carries the Logto session cookie to the
 * proxy. Without it the proxy sees an anonymous request and rejects every call.
 */
export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    logger.error({ url }, 'Session rejected by API proxy, signing out');
    window.location.href = '/api/logto/sign-out';
    throw new SessionExpiredError('Session expired. Please sign in again.');
  }

  return response;
}
