import {
  checkTokenExpiration,
  fetchWithTokenCheck,
  installGlobalFetchInterceptor,
} from "@/lib/global-fetch-handler";

describe("global-fetch-handler", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Mock window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("checkTokenExpiration", () => {
    it("should not redirect on 200 response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        clone: () => mockResponse,
        text: async () => "success",
      } as Response;

      await checkTokenExpiration(mockResponse);

      expect(window.location.href).toBe("");
    });

    it("should redirect on 401 with expired token message", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"detail":"Invalid token: Signature has expired."}',
      } as Response;

      await checkTokenExpiration(mockResponse);

      // Advance timers to trigger the setTimeout
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should redirect on 401 with 'token expired' message", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"error":"token expired"}',
      } as Response;

      await checkTokenExpiration(mockResponse);
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should redirect on 401 with 'Invalid token' message", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"message":"Invalid token"}',
      } as Response;

      await checkTokenExpiration(mockResponse);
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should not redirect on 401 without expired token keywords", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"error":"Invalid credentials"}',
      } as Response;

      await checkTokenExpiration(mockResponse);
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("");
    });

    it("should not redirect on other error statuses", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        clone: function () {
          return this;
        },
        text: async () => '{"error":"Forbidden"}',
      } as Response;

      await checkTokenExpiration(mockResponse);
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("");
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return {
            text: async () => {
              throw new Error("Text read failed");
            },
          } as unknown as Response;
        },
      } as unknown as Response;

      // Should not throw
      await expect(checkTokenExpiration(mockResponse)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[GlobalFetch] Error checking token expiration:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("fetchWithTokenCheck", () => {
    it("should call fetch and check token expiration", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        clone: function () {
          return this;
        },
        text: async () => "success",
      } as Response;

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      const response = await fetchWithTokenCheck(
        "https://api.example.com/test",
        {
          method: "GET",
        }
      );

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "GET",
      });
      expect(response).toBe(mockResponse);
    });

    it("should detect expired token and redirect", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"detail":"Signature has expired"}',
      } as Response;

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await fetchWithTokenCheck("https://api.example.com/test");
      jest.advanceTimersByTime(150);

      expect(window.location.href).toBe("/api/logto/sign-out");
    });
  });

  describe("installGlobalFetchInterceptor", () => {
    it("should override window.fetch", () => {
      const originalWindowFetch = window.fetch;

      installGlobalFetchInterceptor();

      expect(window.fetch).not.toBe(originalWindowFetch);
    });

    it("should intercept fetch calls and check for token expiration", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        clone: function () {
          return this;
        },
        text: async () => '{"detail":"token expired"}',
      } as Response;

      const mockOriginalFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockOriginalFetch;

      installGlobalFetchInterceptor();

      await window.fetch("https://api.example.com/test");
      jest.advanceTimersByTime(150);

      expect(mockOriginalFetch).toHaveBeenCalled();
      expect(window.location.href).toBe("/api/logto/sign-out");
    });

    it("should not break on successful responses", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        clone: function () {
          return this;
        },
        text: async () => "success",
      } as Response;

      const mockOriginalFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockOriginalFetch;

      installGlobalFetchInterceptor();

      const response = await window.fetch("https://api.example.com/test");

      expect(response).toBe(mockResponse);
      expect(window.location.href).toBe("");
    });

    it("should do nothing if window is undefined", () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      expect(() => installGlobalFetchInterceptor()).not.toThrow();

      global.window = originalWindow;
    });
  });
});
