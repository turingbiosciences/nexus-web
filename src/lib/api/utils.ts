import { getApiBaseUrl } from '@/lib/api/get-api-base';

/**
 * Shared API utilities
 */

/**
 * Get the base API URL, validated and normalized
 * @throws {Error} If NEXT_PUBLIC_TURING_API is not set
 * @returns Normalized API URL without trailing slash
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
