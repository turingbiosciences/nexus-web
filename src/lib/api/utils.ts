import { getApiBaseUrl } from '@/lib/api/get-api-base';

/**
 * Shared API utilities
 */

/**
 * Get the base API URL, validated and normalized.
 *
 * On the client this is the same-origin proxy path; on the server it is the
 * internal API address. See get-api-base.ts.
 *
 * @throws {Error} On the server, if TURING_API_INTERNAL_URL is not set
 * @returns Normalized API base without trailing slash
 */
export function getApiUrl(): string {
  return getApiBaseUrl();
}

/**
 * Get the error message shown when a request is attempted without a valid
 * session.
 *
 * The client holds no API credential of its own any more — the proxy supplies
 * one — so the only thing that can be missing here is the Logto session.
 *
 * @param authError - Optional underlying error to include in the message
 */
export function getTokenErrorMessage(authError?: Error | null): string {
  return authError
    ? `Authentication error: ${authError.message}`
    : 'You are not signed in. Please sign in again to continue.';
}
