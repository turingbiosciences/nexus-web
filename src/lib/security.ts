/**
 * Security utilities
 */

/**
 * Sanitizes a filename to prevent directory traversal and remove dangerous characters.
 *
 * This function:
 * 1. Replaces any character that is NOT alphanumeric, dot, dash, or underscore with an underscore.
 * 2. Collapses multiple consecutive dots into a single dot to prevent directory traversal (e.g. "..").
 * 3. Trims leading/trailing dots and whitespace.
 * 4. Limits the length to 255 characters.
 * 5. Ensures the filename is not empty (defaults to "unnamed_file").
 *
 * @param filename - The original filename
 * @returns The sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed_file';

  // 1. Replace unsafe characters with underscore
  // Allow: a-z, A-Z, 0-9, ., -, _
  let sanitized = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 2. Prevent directory traversal by collapsing multiple dots
  // This replaces ".." and "..." etc. with "."
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // 3. Trim leading/trailing dots and whitespace (though whitespace was replaced by _)
  // Leading/trailing dots can be problematic
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');

  // 4. Limit length
  if (sanitized.length > 255) {
    // Keep the extension if possible
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot > 0 && lastDot > sanitized.length - 10) {
      const ext = sanitized.substring(lastDot);
      const name = sanitized.substring(0, 255 - ext.length);
      sanitized = name + ext;
    } else {
      sanitized = sanitized.substring(0, 255);
    }
  }

  // 5. Ensure not empty
  if (!sanitized) return 'unnamed_file';

  return sanitized;
}
