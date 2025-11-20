/**
 * Date utility functions for formatting and calculations
 */

/**
 * Calculate relative time from a given date to now
 * @param date - The date to calculate relative time from
 * @returns A human-readable relative time string
 *
 * @example
 * getRelativeTime(new Date()) // "just now"
 * getRelativeTime(new Date(Date.now() - 5 * 60000)) // "5 mins ago"
 * getRelativeTime(new Date(Date.now() - 2 * 3600000)) // "2 hours ago"
 * getRelativeTime(new Date(Date.now() - 3 * 86400000)) // "3 days ago"
 * getRelativeTime(new Date(Date.now() - 10 * 86400000)) // "Nov 7" (or similar)
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
