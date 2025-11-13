/**
 * Global authentication-aware fetch wrapper that handles token expiration.
 *
 * This wrapper:
 * 1. Adds Authorization header automatically
 * 2. Detects 401 errors with expired token messages
 * 3. Attempts to refresh the token once
 * 4. If refresh fails, redirects to sign-out
 * 5. Throws descriptive errors that React Query can catch globally
 */

import { logger } from "./logger";

interface AuthFetchOptions extends RequestInit {
  token: string;
  onTokenRefresh?: () => Promise<string | null>;
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

/**
 * Check if an error or response indicates an expired token
 */
function isTokenExpiredError(status: number, body: string): boolean {
  if (status !== 401) return false;

  return (
    body.includes("Signature has expired") ||
    body.includes("token expired") ||
    body.includes("Invalid token") ||
    body.includes("Unauthorized")
  );
}

/**
 * Authentication-aware fetch that automatically handles token expiration.
 * Use this for all authenticated API calls.
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions
): Promise<Response> {
  const { token, onTokenRefresh, ...fetchOptions } = options;

  // First attempt with current token
  let response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Check if token expired
  if (response.status === 401) {
    const errorText = await response.clone().text();
    const isExpired = isTokenExpiredError(response.status, errorText);

    if (isExpired) {
      logger.info("Token expired, attempting refresh...");

      // Try to refresh token if handler provided
      if (onTokenRefresh) {
        try {
          const newToken = await onTokenRefresh();

          if (newToken) {
            logger.info("Token refreshed, retrying request");
            // Retry with new token
            response = await fetch(url, {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                Authorization: `Bearer ${newToken}`,
              },
            });

            // If still 401 after refresh, give up and redirect
            if (response.status === 401) {
              logger.error(
                "Still unauthorized after token refresh"
              );
              window.location.href = "/api/logto/sign-out";
              throw new TokenExpiredError(
                "Session expired. Please sign in again."
              );
            }

            return response;
          }
        } catch (refreshError) {
          logger.error({ error: refreshError }, "Token refresh error");
          window.location.href = "/api/logto/sign-out";
          throw new TokenExpiredError("Session expired. Please sign in again.");
        }
      }

      // If no refresh handler or refresh failed, redirect to sign out
      logger.error(
        "Token expired and no refresh available, signing out"
      );
      window.location.href = "/api/logto/sign-out";
      throw new TokenExpiredError("Session expired. Please sign in again.");
    }
  }

  return response;
}

/**
 * Simplified fetch for authenticated requests without token refresh.
 * Useful for one-off requests where you just want to detect expiration.
 */
export async function simpleFetch(
  url: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Check for token expiration
  if (response.status === 401) {
    const errorText = await response.clone().text();
    if (isTokenExpiredError(response.status, errorText)) {
      logger.error("Token expired, signing out");
      window.location.href = "/api/logto/sign-out";
      throw new TokenExpiredError("Session expired. Please sign in again.");
    }
  }

  return response;
}
