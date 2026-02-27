/**
 * Security utilities for sanitizing inputs and outputs.
 */

/**
 * Sanitizes a URL by removing sensitive query parameters.
 * @param url - The URL to sanitize.
 * @returns The sanitized URL string.
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, 'http://dummy.com'); // Base URL for relative paths
    const params = urlObj.searchParams;
    const sensitiveKeys = [
      'token',
      'access_token',
      'refresh_token',
      'id_token',
      'code',
      'state',
      'password',
      'secret',
      'client_secret',
      'api_key',
    ];

    sensitiveKeys.forEach((key) => {
      if (params.has(key)) {
        params.set(key, '[REDACTED]');
      }
    });

    // If the original input was a relative URL, return only the path and query
    if (!url.startsWith('http')) {
      // Decode the pathname to return the original string format if it was just text
      const pathAndQuery = urlObj.pathname + urlObj.search;

      // If the URL constructor encoded spaces or other characters, decode them
      // This happens when we pass "not a valid url" -> http://dummy.com/not%20a%20valid%20url
      const decodedPathAndQuery = decodeURIComponent(pathAndQuery);

      // If the input didn't start with / and wasn't http, URL constructor adds /
      // We should check if the original input started with /
      if (!url.startsWith('/') && decodedPathAndQuery.startsWith('/')) {
        return decodedPathAndQuery.substring(1);
      }
      return decodedPathAndQuery;
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return the original string (or a safe fallback if needed)
    return url;
  }
}

/**
 * Sanitizes a filename to prevent directory traversal and ensure safe characters.
 * @param filename - The filename to sanitize.
 * @returns The sanitized filename.
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal sequences
  let safeName = filename.replace(/(\.\.[\/\\])+/g, '');

  // Remove any character that is not alphanumeric, dot, dash, or underscore
  safeName = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length to 255 characters
  if (safeName.length > 255) {
    const extIndex = safeName.lastIndexOf('.');
    if (extIndex !== -1 && safeName.length - extIndex < 10) {
      // Preserve extension if it's reasonable length
      const ext = safeName.substring(extIndex);
      safeName = safeName.substring(0, 255 - ext.length) + ext;
    } else {
      safeName = safeName.substring(0, 255);
    }
  }

  // Ensure filename is not empty and not just dots
  if (
    !safeName ||
    safeName === '.' ||
    safeName === '..' ||
    /^[._]+$/.test(safeName)
  ) {
    safeName = `upload_${Date.now()}`;
  }

  return safeName;
}
