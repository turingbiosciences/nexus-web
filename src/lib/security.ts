/**
 * Security utility functions
 */

/**
 * Sanitizes a filename to prevent directory traversal and enforce safe character sets.
 *
 * @param filename The original filename
 * @returns A sanitized filename safe for storage and processing
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal sequences and path separators
  // We remove anything before the last slash/backslash to get the basename
  let clean = filename.replace(/^.*[\\\/]/, '');

  // Replace any characters that are NOT alphanumeric, dots, dashes, or underscores with underscores
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Collapse multiple underscores into one (cosmetic improvement)
  clean = clean.replace(/_+/g, '_');

  // Enforce maximum length of 255 characters (common filesystem limit)
  if (clean.length > 255) {
    const parts = clean.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()!;
      // Ensure extension is not too long itself
      const safeExt = ext.substring(0, 20);
      const base = parts.join('.');
      // Truncate base to fit extension
      const maxBaseLength = 255 - safeExt.length - 1; // -1 for dot
      clean = `${base.substring(0, maxBaseLength)}.${safeExt}`;
    } else {
      clean = clean.substring(0, 255);
    }
  }

  // Ensure filename is not empty or just dots/underscores
  // We also reject filenames that are just a combination of dots and underscores
  // as they are often not meaningful or could be hidden files
  if (!clean || /^[._]+$/.test(clean)) {
    return `upload_${Date.now()}`;
  }

  return clean;
}
