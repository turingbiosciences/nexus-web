/**
 * Tests for date utility functions
 */

import { getRelativeTime } from "../date-utils";

describe("getRelativeTime", () => {
  beforeEach(() => {
    // Mock current time to a fixed date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-11-17T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'just now' for dates less than 1 minute ago", () => {
    const date = new Date("2024-11-17T11:59:30Z"); // 30 seconds ago
    expect(getRelativeTime(date)).toBe("just now");
  });

  it("returns minutes ago for dates less than 1 hour ago", () => {
    const date5mins = new Date("2024-11-17T11:55:00Z"); // 5 minutes ago
    expect(getRelativeTime(date5mins)).toBe("5 mins ago");

    const date1min = new Date("2024-11-17T11:59:00Z"); // 1 minute ago
    expect(getRelativeTime(date1min)).toBe("1 min ago");
  });

  it("returns hours ago for dates less than 24 hours ago", () => {
    const date2hours = new Date("2024-11-17T10:00:00Z"); // 2 hours ago
    expect(getRelativeTime(date2hours)).toBe("2 hours ago");

    const date1hour = new Date("2024-11-17T11:00:00Z"); // 1 hour ago
    expect(getRelativeTime(date1hour)).toBe("1 hour ago");
  });

  it("returns days ago for dates less than 7 days ago", () => {
    const date3days = new Date("2024-11-14T12:00:00Z"); // 3 days ago
    expect(getRelativeTime(date3days)).toBe("3 days ago");

    const date1day = new Date("2024-11-16T12:00:00Z"); // 1 day ago
    expect(getRelativeTime(date1day)).toBe("1 day ago");
  });

  it("returns formatted date for dates 7 or more days ago", () => {
    const date10days = new Date("2024-11-07T12:00:00Z"); // 10 days ago
    const result = getRelativeTime(date10days);
    expect(result).toMatch(/Nov 7/); // Format: "Nov 7"
  });

  it("handles edge case of exactly 1 minute", () => {
    const date = new Date("2024-11-17T11:59:00Z");
    expect(getRelativeTime(date)).toBe("1 min ago");
  });

  it("handles edge case of exactly 1 hour", () => {
    const date = new Date("2024-11-17T11:00:00Z");
    expect(getRelativeTime(date)).toBe("1 hour ago");
  });

  it("handles edge case of exactly 1 day", () => {
    const date = new Date("2024-11-16T12:00:00Z");
    expect(getRelativeTime(date)).toBe("1 day ago");
  });

  it("handles edge case of exactly 7 days", () => {
    const date = new Date("2024-11-10T12:00:00Z");
    const result = getRelativeTime(date);
    expect(result).toMatch(/Nov 10/);
  });
});
