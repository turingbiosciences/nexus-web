/**
 * Utility to get the API base URL with validation.
 * Centralizes the environment variable check that was repeated across query files.
 */

/**
 * Get the API base URL from environment variables.
 * @throws Error if NEXT_PUBLIC_TURING_API is not configured
 * @returns The normalized API base URL (without trailing slash)
 */
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_TURING_API;
  if (!base) {
    throw new Error('Missing NEXT_PUBLIC_TURING_API environment variable');
  }
  // Normalize by removing trailing slash if present
  let url = base;
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}
