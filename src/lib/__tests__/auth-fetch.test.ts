import { authFetch, simpleFetch, TokenExpiredError } from "@/lib/auth-fetch";

describe("auth-fetch", () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("authFetch", () => {
    it("should add Authorization header and return successful response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await authFetch("https://api.example.com/test", {
        token: "test-token",
        method: "GET",
      });

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(response).toBe(mockResponse);
    });

    it("should detect expired token and redirect to sign-out", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"Invalid token: Signature has expired."}',
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        authFetch("https://api.example.com/test", {
          token: "expired-token",
          method: "GET",
        })
      ).rejects.toThrow(TokenExpiredError);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should attempt token refresh on 401 with expired token", async () => {
      const expired401Response = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"token expired"}',
      } as Response;

      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "success" }),
      } as Response;

      mockFetch
        .mockResolvedValueOnce(expired401Response)
        .mockResolvedValueOnce(successResponse);

      const mockRefresh = jest.fn().mockResolvedValue("new-token");

      const response = await authFetch("https://api.example.com/test", {
        token: "old-token",
        method: "GET",
        onTokenRefresh: mockRefresh,
      });

      expect(mockRefresh).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.example.com/test",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer new-token",
          },
        }
      );
      expect(response.ok).toBe(true);
    });

    it("should redirect if still 401 after token refresh", async () => {
      const expired401Response = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"Signature has expired"}',
      } as Response;

      mockFetch
        .mockResolvedValueOnce(expired401Response)
        .mockResolvedValueOnce(expired401Response);

      const mockRefresh = jest.fn().mockResolvedValue("new-token");

      await expect(
        authFetch("https://api.example.com/test", {
          token: "old-token",
          method: "GET",
          onTokenRefresh: mockRefresh,
        })
      ).rejects.toThrow(TokenExpiredError);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should redirect if token refresh fails", async () => {
      const expired401Response = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"Invalid token"}',
      } as Response;

      mockFetch.mockResolvedValueOnce(expired401Response);

      const mockRefresh = jest
        .fn()
        .mockRejectedValue(new Error("Refresh failed"));

      await expect(
        authFetch("https://api.example.com/test", {
          token: "old-token",
          method: "GET",
          onTokenRefresh: mockRefresh,
        })
      ).rejects.toThrow(TokenExpiredError);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should not redirect on 401 without expired token message", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"Invalid credentials"}',
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await authFetch("https://api.example.com/test", {
        token: "test-token",
        method: "GET",
      });

      expect(response.status).toBe(401);
      expect(window.location.href).toBe(""); // Not redirected
    });

    it("should preserve custom headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await authFetch("https://api.example.com/test", {
        token: "test-token",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "value",
        },
      });

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "value",
          Authorization: "Bearer test-token",
        },
      });
    });
  });

  describe("simpleFetch", () => {
    it("should add Authorization header and return successful response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await simpleFetch(
        "https://api.example.com/test",
        "test-token",
        { method: "GET" }
      );

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(response).toBe(mockResponse);
    });

    it("should detect expired token and redirect to sign-out", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"token expired"}',
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        simpleFetch("https://api.example.com/test", "expired-token")
      ).rejects.toThrow(TokenExpiredError);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should not redirect on 401 without expired token message", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => '{"detail":"Bad credentials"}',
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await simpleFetch(
        "https://api.example.com/test",
        "test-token"
      );

      expect(response.status).toBe(401);
      expect(window.location.href).toBe(""); // Not redirected
    });

    it("should work without optional options parameter", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await simpleFetch("https://api.example.com/test", "test-token");

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
    });
  });

  describe("TokenExpiredError", () => {
    it("should be instanceof Error", () => {
      const error = new TokenExpiredError("Session expired");
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("TokenExpiredError");
      expect(error.message).toBe("Session expired");
    });
  });
});
