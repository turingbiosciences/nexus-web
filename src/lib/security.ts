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
  // We use a simple character class which is safe from backtracking issues
  let sanitized = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 2. Prevent directory traversal by collapsing multiple dots
  // Splitting by dot and filtering empty strings removes consecutive dots effectively
  // e.g. "a..b" -> ["a", "", "b"] -> ["a", "b"] -> "a.b"
  sanitized = sanitized
    .split('.')
    .filter((part) => part.length > 0)
    .join('.');

  // 3. Trimming leading/trailing dots is handled implicitly by the split/filter/join above
  // because leading/trailing dots result in empty strings at the ends of the array,
  // which are filtered out.
  // e.g. ".a." -> ["", "a", ""] -> ["a"] -> "a"

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
