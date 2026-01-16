/**
 * Tests for format-date utilities
 */

import { formatDate, formatDateTime, formatISODate } from "../format-date";

describe("format-date", () => {
    // Use a fixed date for consistent testing (local time)
    const testDate = new Date(2026, 0, 12, 17, 30, 0); // Jan 12, 2026 5:30 PM

    describe("formatDate", () => {
        it("formats date as 'Mon DD, YYYY'", () => {
            const result = formatDate(testDate);
            expect(result).toBe("Jan 12, 2026");
        });

        it("handles different months correctly", () => {
            const marchDate = new Date(2026, 2, 15); // March 15
            expect(formatDate(marchDate)).toContain("Mar");

            const decemberDate = new Date(2026, 11, 25); // December 25
            expect(formatDate(decemberDate)).toContain("Dec");
        });

        it("handles first day of month", () => {
            const firstDay = new Date(2026, 1, 1); // Feb 1, 2026
            const result = formatDate(firstDay);
            expect(result).toBe("Feb 1, 2026");
        });

        it("handles last day of month", () => {
            const lastDay = new Date(2026, 0, 31); // Jan 31, 2026
            const result = formatDate(lastDay);
            expect(result).toBe("Jan 31, 2026");
        });

        it("uses default en-US locale", () => {
            const result = formatDate(testDate);
            // Should contain English month abbreviation
            expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
        });

        it("accepts custom locale", () => {
            // Note: locale formatting varies by environment
            const result = formatDate(testDate, "en-GB");
            expect(result).toBeTruthy();
        });
    });

    describe("formatDateTime", () => {
        it("includes time in the output", () => {
            const result = formatDateTime(testDate);
            // Should contain colon (for time)
            expect(result).toContain(":");
        });

        it("formats date portion correctly", () => {
            const result = formatDateTime(testDate);
            expect(result).toContain("Jan");
            expect(result).toContain("2026");
        });

        it("handles midnight correctly", () => {
            const midnight = new Date(2026, 0, 12, 0, 0, 0);
            const result = formatDateTime(midnight);
            expect(result).toContain("12:00");
        });

        it("handles noon correctly", () => {
            const noon = new Date(2026, 0, 12, 12, 0, 0);
            const result = formatDateTime(noon);
            expect(result).toContain("12:00");
        });
    });

    describe("formatISODate", () => {
        it("returns YYYY-MM-DD format", () => {
            const result = formatISODate(testDate);
            expect(result).toBe("2026-01-12");
        });

        it("pads single-digit months", () => {
            const january = new Date(2026, 0, 5); // Jan 5
            const result = formatISODate(january);
            expect(result).toBe("2026-01-05");
        });

        it("pads single-digit days", () => {
            const singleDigitDay = new Date(2026, 1, 5); // Feb 5
            const result = formatISODate(singleDigitDay);
            expect(result).toBe("2026-02-05");
        });

        it("handles end of year", () => {
            const endOfYear = new Date(2026, 11, 31); // Dec 31
            const result = formatISODate(endOfYear);
            expect(result).toBe("2026-12-31");
        });

        it("handles beginning of year", () => {
            const beginningOfYear = new Date(2026, 0, 1); // Jan 1
            const result = formatISODate(beginningOfYear);
            expect(result).toBe("2026-01-01");
        });
    });

    describe("edge cases", () => {
        it("handles leap year date", () => {
            const leapDay = new Date(2024, 1, 29); // Feb 29, 2024
            expect(formatDate(leapDay)).toBe("Feb 29, 2024");
            expect(formatISODate(leapDay)).toBe("2024-02-29");
        });

        it("handles dates far in the past", () => {
            const oldDate = new Date(1990, 4, 15); // May 15, 1990
            expect(formatDate(oldDate)).toBe("May 15, 1990");
        });

        it("handles dates far in the future", () => {
            const futureDate = new Date(2050, 7, 20); // Aug 20, 2050
            expect(formatDate(futureDate)).toBe("Aug 20, 2050");
        });
    });
});
