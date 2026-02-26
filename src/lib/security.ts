/**
 * Security utilities for input sanitization and validation.
 */

/**
 * Sanitizes a filename to prevent directory traversal and ensure safe characters.
 *
 * - Removes directory traversal sequences (..).
 * - Enforces safe character set (alphanumeric, dots, dashes, underscores).
 * - Limits length to 255 chars.
 * - Falls back to timestamp-based name if result is empty.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path and control characters
  let safeName = filename
    .replace(/^.*[\\\/]/, '')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    .replace(/^\.+/, ''); // Remove leading dots

  // Replace invalid characters with underscore
  safeName = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Collapse multiple dots to prevent extension spoofing or messiness
  // Using split/filter/join to avoid "while" loop security hotspot
  if (safeName.includes('..')) {
    safeName = safeName.split('.').filter((p) => p).join('.');
  }

  // Truncate to 255 chars, preserving extension if possible
  if (safeName.length > 255) {
    const extIndex = safeName.lastIndexOf('.');
    if (extIndex !== -1 && safeName.length - extIndex < 10) {
      const ext = safeName.substring(extIndex);
      safeName = safeName.substring(0, 255 - ext.length) + ext;
    } else {
      safeName = safeName.substring(0, 255);
    }
  }

  // Fallback if empty or invalid
  if (!safeName || safeName === '.' || safeName === '..') {
    return `upload_${Date.now()}`;
  }

  return safeName;
}

/**
 * Sanitizes a URL by redacting sensitive query parameters.
 */
export function sanitizeUrl(urlStr: string): string {
  try {
    // Handle relative URLs by adding a dummy base
    const isRelative = !urlStr.startsWith('http');
    const url = new URL(urlStr, isRelative ? 'http://dummy.com' : undefined);

    const sensitiveKeys = [
      'token',
      'access_token',
      'refresh_token',
      'id_token',
      'code',
      'state',
      'password',
      'secret',
      'key',
      'apikey',
      'api_key',
      'client_secret',
      'client_id',
    ];

    sensitiveKeys.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    });

    if (isRelative) {
      return url.pathname + url.search + url.hash;
    }
    return url.toString();
  } catch {
    // If invalid URL, return original to avoid breaking functionality,
    // but try a simple regex replacement for common patterns as a backup
    return urlStr.replace(
      /((?:access_)?token|secret|key)=[^&]+/gi,
      '$1=[REDACTED]'
    );
  }
}
