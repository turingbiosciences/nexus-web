/**
 * Utility to get the API base URL with validation.
 * Centralizes the environment variable check that was repeated across query files.
 */

/**
 * Get the API base URL.
 *
 * The browser gets a SAME-ORIGIN path, not an absolute URL. Requests go to
 * /api/turing/* on this origin and are proxied to the internal API server-side
 * (see src/app/api/turing/[...path]/route.ts). This is what allows the API
 * container to stay unpublished and unreachable from the internet.
 *
 * Do not reintroduce NEXT_PUBLIC_TURING_API here. Being a NEXT_PUBLIC_ value it
 * is inlined into the client bundle, which republishes the API's address and
 * forces the CSP connect-src exception in next.config.ts back open.
 *
 * Server-side callers get the internal URL directly, skipping the proxy hop —
 * a relative path cannot be fetched without an origin.
 *
 * @throws Error if a server-side caller has no TURING_API_INTERNAL_URL configured
 * @returns The API base (no trailing slash)
 */
export function getApiBaseUrl(): string {
  // Client: same-origin proxy path.
  if (typeof window !== 'undefined') {
    return '/api/turing';
  }

  // Server: talk to the API container directly.
  const internal = process.env.TURING_API_INTERNAL_URL;
  if (!internal) {
    throw new Error('Missing TURING_API_INTERNAL_URL environment variable');
  }

  let url = internal;
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}
