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
 * Confirms with the server whether the Logto session is genuinely gone.
 *
 * A 401 from the proxy is not by itself proof that the user is signed out —
 * it also covers transient cases where the session simply could not be read
 * for that one request. Acting on the 401 alone produced a sign-out loop:
 * a single blip redirected to sign-out, the user signed back in, and the next
 * blip did it again.
 *
 * Returns false only on an authoritative "not authenticated". If the check
 * cannot be completed at all, it reports the session as still valid: failing
 * to reach this endpoint is not evidence of a dead session, and signing the
 * user out is the destructive option.
 */
async function sessionIsGone(): Promise<boolean> {
  try {
    const res = await fetch('/api/logto/user', { credentials: 'include' });
    if (!res.ok) return false;
    const data = (await res.json()) as { isAuthenticated?: boolean };
    return data?.isAuthenticated === false;
  } catch {
    return false;
  }
}

/** Set once a sign-out redirect is under way, so concurrent 401s do not stack. */
let signingOut = false;

/**
 * Fetch an API path through the proxy, redirecting to sign-out only once the
 * session is confirmed invalid.
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
    if (signingOut) {
      throw new SessionExpiredError('Session expired. Please sign in again.');
    }

    if (await sessionIsGone()) {
      signingOut = true;
      logger.error({ url }, 'Session confirmed invalid, signing out');
      window.location.href = '/api/logto/sign-out';
      throw new SessionExpiredError('Session expired. Please sign in again.');
    }

    // Session is still good, so this 401 was about this request, not the
    // session. Hand it back and let the caller deal with it.
    logger.warn(
      { url },
      'API returned 401 but the session is still valid; not signing out'
    );
  }

  return response;
}

/** Test seam — clears the one-shot sign-out latch. */
export function resetSignOutLatch(): void {
  signingOut = false;
}
