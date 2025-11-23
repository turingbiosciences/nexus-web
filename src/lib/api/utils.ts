/**
 * Shared API utilities
 */

import { Project } from "@/types/project";

/**
 * Get the base API URL, validated and normalized
 * @throws {Error} If NEXT_PUBLIC_TURING_API is not set
 * @returns Normalized API URL without trailing slash
 */
export function getApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, "");
}

/**
 * Map API status to internal project status
 */
export const API_STATUS_MAP: Record<string, Project["status"]> = {
  active: "setup",
  running: "running",
  complete: "complete",
};

/**
 * Get error message for missing/invalid access token
 * @param tokenError - Optional token error to include in message
 */
export function getTokenErrorMessage(tokenError?: Error | null): string {
  return tokenError
    ? `Authentication error: ${tokenError.message}`
    : "Authentication token unavailable. Please sign out and sign back in to obtain an access token.";
}
