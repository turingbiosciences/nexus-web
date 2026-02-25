/**
 * Security utilities for the application.
 */

// List of query parameters to redact from URLs
export const SENSITIVE_PARAMS = [
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'code',
  'state',
  'secret',
  'client_secret',
  'key',
  'api_key',
  'password',
  'client_id', // Often public, but sometimes treated as semi-private in logs
];

// Pre-compiled regex for sensitive parameters to avoid dynamic construction and improve performance
// Matches: ?param=value or &param=value
const SENSITIVE_REGEX = new RegExp(
  `([?&])(${SENSITIVE_PARAMS.join('|')})=([^&]*)`,
  'gi'
);

/**
 * Redacts sensitive query parameters from a URL string.
 * Used for logging to prevent leaking secrets.
 *
 * @param url The URL to sanitize (can be absolute or relative)
 * @returns The sanitized URL string
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    // Handle relative URLs by adding a dummy base
    const isRelative = !url.startsWith('http');
    // Use https://example.com as dummy base to avoid "insecure protocol" warnings
    const urlObj = new URL(url, isRelative ? 'https://example.com' : undefined);

    let redacted = false;

    SENSITIVE_PARAMS.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
        redacted = true;
      }
    });

    if (!redacted) {
      return url;
    }

    // Return the appropriate format
    if (isRelative) {
      return urlObj.pathname + urlObj.search;
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return the original URL but try to mask known patterns
    // using regex as a fallback (less reliable but better than crashing or returning nothing)
    try {
      return url.replace(SENSITIVE_REGEX, '$1$2=[REDACTED]');
    } catch {
      // If all else fails, return a safe fallback to avoid logging the raw URL
      return '[INVALID_URL]';
    }
  }
}

/**
 * Sanitize a filename to prevent directory traversal and other file system attacks.
 *
 * @param filename The filename to sanitize
 * @returns The sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal sequences by taking only the basename
  // We handle both forward and backward slashes
  const lastForwardSlash = filename.lastIndexOf('/');
  const lastBackSlash = filename.lastIndexOf('\\');
  const lastSlashIndex = Math.max(lastForwardSlash, lastBackSlash);

  const name =
    lastSlashIndex >= 0 ? filename.substring(lastSlashIndex + 1) : filename;

  // Remove non-alphanumeric characters except dots, dashes, and underscores
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure the filename is not empty and has a reasonable length
  if (!sanitized || sanitized.length > 255) {
    return `upload_${Date.now()}`;
  }

  return sanitized;
}
