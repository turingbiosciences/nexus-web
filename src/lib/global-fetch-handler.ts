/**
 * Global fetch error handler that can be used across the application.
 *
 * This provides a centralized way to handle authentication errors
 * without needing to wrap every fetch call in try-catch blocks.
 */

import { logger } from "@/lib/logger";

/**
 * Check if a fetch response indicates an expired token
 */
export async function checkTokenExpiration(response: Response): Promise<void> {
  if (response.status === 401) {
    // Clone the response so we can read the body without consuming it
    const clonedResponse = response.clone();

    try {
      const errorText = await clonedResponse.text();
      const isExpired =
        errorText.includes("Signature has expired") ||
        errorText.includes("token expired") ||
        errorText.includes("Invalid token") ||
        errorText.includes("Unauthorized");

      if (isExpired) {
        logger.warn("Token expired detected, redirecting to sign out");

        // Use setTimeout to avoid interrupting the current execution flow
        setTimeout(() => {
          window.location.href = "/api/logto/sign-out";
        }, 100);
      }
    } catch (err) {
      logger.error({ error: err }, "Error checking token expiration");
    }
  }
}

/**
 * Wrap a fetch call with automatic token expiration detection.
 * This can be used for any fetch call in the application.
 */
export async function fetchWithTokenCheck(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // Check for token expiration in background
  // Don't await this so it doesn't block the response
  checkTokenExpiration(response);

  return response;
}

/**
 * Global window.fetch override (optional, use with caution).
 * This will intercept ALL fetch calls in the application.
 * Only enable this if you want automatic token expiration handling everywhere.
 */
export function installGlobalFetchInterceptor() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const response = await originalFetch(input, init);

    // Check for token expiration without blocking the response
    checkTokenExpiration(response);

    return response;
  };

  logger.debug("Global fetch interceptor installed");
}

/**
 * Restore the original window.fetch
 */
export function uninstallGlobalFetchInterceptor() {
  // This is a placeholder - in practice, you'd need to store the original fetch
  logger.debug("Global fetch interceptor uninstalled");
}
