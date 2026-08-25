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
 * Get error message for missing/invalid access token
 * @param tokenError - Optional token error to include in message
 */
export function getTokenErrorMessage(tokenError?: Error | null): string {
  return tokenError
    ? `Authentication error: ${tokenError.message}`
    : 'Authentication token unavailable. Please sign out and sign back in to obtain an access token.';
}
