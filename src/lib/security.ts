/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitizes a filename to prevent directory traversal and ensure safe character set.
 *
 * Rules:
 * 1. Removes path components (prevent directory traversal).
 * 2. Allows only alphanumeric characters, dots, dashes, and underscores.
 * 3. Truncates to 255 characters (filesystem limit).
 * 4. Preserves file extension if possible.
 * 5. Replaces invalid characters with underscores.
 * 6. Ensures the filename is not empty or just dots.
 */
export function sanitizeFilename(filename: string): string {
  // 1. Remove path information (directory traversal)
  // Cross-platform check for both / and \
  const name = filename.replace(/^.*[\\\/]/, '');

  if (!name || name === '.' || name === '..') {
    return 'unnamed_file';
  }

  // Split into name and extension
  // Handle cases like "archive.tar.gz" -> name="archive.tar", ext="gz"
  // or "image.png" -> name="image", ext="png"
  const lastDotIndex = name.lastIndexOf('.');

  let baseName = name;
  let ext = '';

  if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
    baseName = name.substring(0, lastDotIndex);
    ext = name.substring(lastDotIndex + 1);
  }

  // 2. Sanitize base name: allow only alphanumeric, -, _, .
  // Replace invalid chars with underscore
  const sanitizedBase = baseName.replace(/[^a-zA-Z0-9\-_\.]/g, '_');

  // 3. Sanitize extension: allow only alphanumeric
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '');

  // 4. Reassemble
  let sanitized = sanitizedExt
    ? `${sanitizedBase}.${sanitizedExt}`
    : sanitizedBase;

  // 5. Truncate to 255
  if (sanitized.length > 255) {
    if (sanitizedExt) {
      // Truncate base name to fit extension
      const maxBaseLength = 255 - sanitizedExt.length - 1; // -1 for dot
      if (maxBaseLength > 0) {
        sanitized = `${sanitizedBase.substring(0, maxBaseLength)}.${sanitizedExt}`;
      } else {
        // Extension is too long or something weird, just truncate whole string
        sanitized = sanitized.substring(0, 255);
      }
    } else {
      sanitized = sanitized.substring(0, 255);
    }
  }

  // 6. Ensure not empty or dots after sanitization
  if (!sanitized || /^\.+$/.test(sanitized)) {
    return 'unnamed_file';
  }

  return sanitized;
}
