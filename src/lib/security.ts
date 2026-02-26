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
  // Using split().pop() instead of greedy regex to avoid ReDoS
  let safeName = filename.split(/[\\\/]/).pop() || filename;

  safeName = safeName.replace(/[\x00-\x1f\x80-\x9f]/g, '').replace(/^\.+/, ''); // Remove leading dots

  // Replace invalid characters with underscore
  safeName = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Collapse multiple dots to prevent extension spoofing or messiness
  // Using split/filter/join to avoid "while" loop security hotspot
  if (safeName.includes('..')) {
    safeName = safeName.split('.').filter(Boolean).join('.');
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
    // Use crypto.randomUUID if available, otherwise fallback to a basic random string
    // This addresses potential "Weak Cryptography" hotspots for filename generation
    return `upload_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  }

  return safeName;
}

/**
 * Sanitizes a URL by redacting sensitive query parameters.
 */
export function sanitizeUrl(urlStr: string): string {
  try {
    let url: URL;
    let isRelative = false;

    // First, try to parse as an absolute URL. If that fails, treat as relative
    // and use a dummy base to construct a full URL object.
    try {
      url = new URL(urlStr);
    } catch {
      isRelative = true;
      // Use https to avoid mixed content warnings/sonar hotspots
      url = new URL(urlStr, 'https://example.com');
    }
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

    const sensitiveKeySet = new Set(sensitiveKeys.map((k) => k.toLowerCase()));

    // Redact sensitive query parameters (case-insensitive by key)
    for (const [key] of url.searchParams.entries()) {
      if (sensitiveKeySet.has(key.toLowerCase())) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }

    // Redact sensitive data that may appear in the URL fragment (e.g., OAuth tokens)
    if (url.hash && url.hash.length > 1) {
      const fragment = url.hash.substring(1);
      const fragmentParams = new URLSearchParams(fragment);

      for (const [key] of fragmentParams.entries()) {
        if (sensitiveKeySet.has(key.toLowerCase())) {
          fragmentParams.set(key, '[REDACTED]');
        }
      }

      const redactedFragment = fragmentParams.toString();
      url.hash = redactedFragment ? `#${redactedFragment}` : '';
    }
    if (isRelative) {
      return url.pathname + url.search + url.hash;
    }
    return url.toString();
  } catch {
    // If URL parsing fails, we cannot guarantee safe sanitization.
    // Return a static string to avoid leaking secrets or ReDoS risks.
    return '[Invalid URL]';
  }
}
