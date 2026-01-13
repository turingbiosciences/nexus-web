/**
 * Date formatting utilities to eliminate repeated formatting patterns.
 */

/**
 * Default date format options used throughout the application
 */
const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
};

/**
 * Format a date using the standard application date format.
 * Example output: "Jan 12, 2026"
 *
 * @param date Date to format
 * @param locale Locale to use for formatting (defaults to en-US)
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = "en-US"): string {
    return date.toLocaleDateString(locale, DEFAULT_DATE_OPTIONS);
}

/**
 * Format a date with time.
 * Example output: "Jan 12, 2026, 5:30 PM"
 *
 * @param date Date to format
 * @param locale Locale to use for formatting (defaults to en-US)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date, locale: string = "en-US"): string {
    return date.toLocaleDateString(locale, {
        ...DEFAULT_DATE_OPTIONS,
        hour: "numeric",
        minute: "2-digit",
    });
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 *
 * @param date Date to format
 * @returns ISO date string
 */
export function formatISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}
