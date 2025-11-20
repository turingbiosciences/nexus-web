/**
 * Shared test setup utilities
 * Provides common mock configurations and setup functions for tests
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

/**
 * Standard beforeEach setup for tests
 * Clears all mocks and sets up environment
 */
export function setupTestEnvironment(options?: {
  apiUrl?: string;
  clearMocks?: boolean;
}) {
  const { apiUrl = "https://api.example.com", clearMocks = true } = options || {};
  
  if (clearMocks) {
    jest.clearAllMocks();
  }
  
  if (apiUrl) {
    process.env.NEXT_PUBLIC_TURING_API = apiUrl;
  }
}

/**
 * Standard afterEach cleanup for tests
 */
export function cleanupTestEnvironment(options?: {
  removeApiUrl?: boolean;
}) {
  const { removeApiUrl = true } = options || {};
  
  if (removeApiUrl) {
    delete process.env.NEXT_PUBLIC_TURING_API;
  }
}

/**
 * Creates a React Query wrapper for testing hooks
 */
export function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Mock return value for useAccessToken hook
 */
export function createMockAccessToken(overrides?: {
  accessToken?: string | null;
  isLoading?: boolean;
  error?: Error | null;
  isAuthenticated?: boolean;
  authLoading?: boolean;
}) {
  return {
    accessToken: "mock-token",
    isLoading: false,
    error: null,
    refreshToken: jest.fn().mockResolvedValue("new-token"),
    isAuthenticated: true,
    authLoading: false,
    ...overrides,
  };
}

/**
 * Mock return value for useToast hook
 */
export function createMockToast() {
  return {
    push: jest.fn(),
  };
}

/**
 * Creates a successful mock fetch response
 */
export function createMockFetchResponse<T>(data: T, options?: {
  ok?: boolean;
  status?: number;
}) {
  const { ok = true, status = 200 } = options || {};
  
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

/**
 * Creates a failed mock fetch response
 */
export function createMockFetchError(options?: {
  status?: number;
  message?: string;
}) {
  const { status = 500, message = "Internal Server Error" } = options || {};
  
  return {
    ok: false,
    status,
    json: jest.fn().mockRejectedValue(new Error(message)),
    text: jest.fn().mockResolvedValue(message),
  };
}
