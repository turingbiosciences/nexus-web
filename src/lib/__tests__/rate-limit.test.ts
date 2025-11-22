/**
 * Tests for rate limiting functionality
 */

import { checkRateLimit, getRateLimitHeaders } from "../rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Clear any cached entries between tests
    jest.clearAllTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow requests under the limit", () => {
      const result1 = checkRateLimit("test-user-1", {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit("test-user-1", {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit("test-user-1", {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests over the limit", () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      // First two requests succeed
      checkRateLimit("test-user-2", config);
      checkRateLimit("test-user-2", config);

      // Third request fails
      const result = checkRateLimit("test-user-2", config);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should isolate rate limits by identifier", () => {
      const config = { maxRequests: 1, windowMs: 60000 };

      const result1 = checkRateLimit("user-a", config);
      const result2 = checkRateLimit("user-b", config);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Second request from user-a should fail
      const result3 = checkRateLimit("user-a", config);
      expect(result3.success).toBe(false);

      // But user-b should still succeed
      const result4 = checkRateLimit("user-b", config);
      expect(result4.success).toBe(false); // user-b's second request also fails
    });

    it("should use prefix to namespace rate limits", () => {
      checkRateLimit("user", { maxRequests: 1, windowMs: 60000, prefix: "api" });
      
      // Same user, different prefix should succeed
      const result = checkRateLimit("user", { 
        maxRequests: 1, 
        windowMs: 60000, 
        prefix: "auth" 
      });
      
      expect(result.success).toBe(true);
    });

    it("should return correct reset time", () => {
      const now = Date.now();
      const windowMs = 60000;
      
      const result = checkRateLimit("test-user-3", {
        maxRequests: 10,
        windowMs,
      });

      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + windowMs + 100); // Allow small margin
    });
  });

  describe("getRateLimitHeaders", () => {
    it("should return standard rate limit headers", () => {
      const result = {
        success: true,
        limit: 10,
        remaining: 5,
        reset: Date.now() + 60000,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("5");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("should include Retry-After header when rate limited", () => {
      const resetTime = Date.now() + 60000;
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: resetTime,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBeDefined();
      expect(parseInt(headers["Retry-After"])).toBeGreaterThan(0);
    });
  });
});
