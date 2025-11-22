/**
 * Tests for environment variable validation
 */

import { getServerEnv, getClientEnv } from "../env";

describe("env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getServerEnv", () => {
    it("should throw error when called on client side", () => {
      // Mock window to simulate client side
      (global as any).window = {};

      expect(() => getServerEnv()).toThrow(
        "getServerEnv() can only be called on the server side"
      );

      delete (global as any).window;
    });

    it("should parse valid server environment variables", () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: "https://logto.example.com",
        LOGTO_APP_ID: "test-app-id",
        LOGTO_APP_SECRET: "test-app-secret",
        LOGTO_M2M_APP_ID: "test-m2m-id",
        LOGTO_M2M_APP_SECRET: "test-m2m-secret",
        LOGTO_M2M_ENDPOINT: "https://m2m.example.com",
        NEXTAUTH_URL: "https://app.example.com",
        NEXTAUTH_SECRET: "this-is-a-very-long-secret-at-least-32-chars",
        NODE_ENV: "test",
      };

      const env = getServerEnv();

      expect(env.LOGTO_ENDPOINT).toBe("https://logto.example.com");
      expect(env.LOGTO_APP_ID).toBe("test-app-id");
      expect(env.NODE_ENV).toBe("test");
    });

    it("should throw error for missing required variables", () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: "https://logto.example.com",
        // Missing other required variables
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });

    it("should throw error for invalid URL format", () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: "not-a-url",
        LOGTO_APP_ID: "test-app-id",
        LOGTO_APP_SECRET: "test-app-secret",
        LOGTO_M2M_APP_ID: "test-m2m-id",
        LOGTO_M2M_APP_SECRET: "test-m2m-secret",
        LOGTO_M2M_ENDPOINT: "https://m2m.example.com",
        NEXTAUTH_URL: "https://app.example.com",
        NEXTAUTH_SECRET: "this-is-a-very-long-secret-at-least-32-chars",
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });

    it("should throw error for short NEXTAUTH_SECRET", () => {
      process.env = {
        ...process.env,
        LOGTO_ENDPOINT: "https://logto.example.com",
        LOGTO_APP_ID: "test-app-id",
        LOGTO_APP_SECRET: "test-app-secret",
        LOGTO_M2M_APP_ID: "test-m2m-id",
        LOGTO_M2M_APP_SECRET: "test-m2m-secret",
        LOGTO_M2M_ENDPOINT: "https://m2m.example.com",
        NEXTAUTH_URL: "https://app.example.com",
        NEXTAUTH_SECRET: "short", // Too short
      };

      expect(() => getServerEnv()).toThrow(
        /Invalid or missing server environment variables/
      );
    });
  });

  describe("getClientEnv", () => {
    it("should parse valid client environment variables", () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_TURING_API: "https://api.example.com",
        NEXT_PUBLIC_LOGTO_ENDPOINT: "https://logto.example.com",
        NEXT_PUBLIC_LOGTO_APP_ID: "test-app-id",
      };

      const env = getClientEnv();

      expect(env.NEXT_PUBLIC_TURING_API).toBe("https://api.example.com");
      expect(env.NEXT_PUBLIC_LOGTO_ENDPOINT).toBe("https://logto.example.com");
      expect(env.NEXT_PUBLIC_LOGTO_APP_ID).toBe("test-app-id");
    });

    it("should throw error for missing client variables", () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_TURING_API: "https://api.example.com",
        // Missing other variables
      };

      expect(() => getClientEnv()).toThrow(
        /Invalid or missing client environment variables/
      );
    });

    it("should throw error for invalid URL in client variables", () => {
      process.env = {
        ...process.env,
        NEXT_PUBLIC_TURING_API: "not-a-url",
        NEXT_PUBLIC_LOGTO_ENDPOINT: "https://logto.example.com",
        NEXT_PUBLIC_LOGTO_APP_ID: "test-app-id",
      };

      expect(() => getClientEnv()).toThrow(
        /Invalid or missing client environment variables/
      );
    });
  });
});
