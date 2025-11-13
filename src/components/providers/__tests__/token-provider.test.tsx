import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  TokenProvider,
  useAccessToken,
} from "@/components/providers/token-provider";

// Test component that uses the token hook
function TestComponent() {
  const { accessToken, isLoading, authLoading, error } = useAccessToken();

  if (authLoading) return <div>Checking authentication...</div>;
  if (isLoading) return <div>Loading token...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (accessToken) return <div>Token: {accessToken}</div>;
  return <div>No token</div>;
}

describe("TokenProvider", () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Suppress console logs and errors during tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it("throws error when useAccessToken is used outside TokenProvider", () => {
    // Suppress React error boundary logs
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAccessToken must be used within a TokenProvider");

    consoleErrorSpy.mockRestore();
  });

  it("shows loading state initially when checking authentication", async () => {
    // Mock the /api/logto/user endpoint to simulate checking auth
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: false }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    // Initially should show checking authentication
    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByText("No token")).toBeInTheDocument();
    });
  });

  it("shows no token when user is not authenticated", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: false }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No token")).toBeInTheDocument();
    });
  });

  it("fetches and displays M2M token when authenticated", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: true }),
        });
      }
      if (url === "/api/logto/token") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            accessToken: "mock-m2m-token-123",
          }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Token: mock-m2m-token-123")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/logto/token");
  });

  it("handles token fetch error", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: true }),
        });
      }
      if (url === "/api/logto/token") {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({
            error: "Internal server error",
          }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("handles network error during token fetch", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: true }),
        });
      }
      if (url === "/api/logto/token") {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error: Network error")).toBeInTheDocument();
    });
  });

  it("clears token when user signs out", async () => {
    // Start authenticated
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: true }),
        });
      }
      if (url === "/api/logto/token") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            accessToken: "mock-token",
          }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    const { unmount } = render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Token: mock-token")).toBeInTheDocument();
    });

    // Clean up and start fresh for sign-out test
    unmount();

    // Now test sign-out scenario - user is not authenticated
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: false }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No token")).toBeInTheDocument();
    });
  });

  it("provides refreshToken function", async () => {
    let tokenCallCount = 0;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/logto/user") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isAuthenticated: true }),
        });
      }
      if (url === "/api/logto/token") {
        tokenCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            accessToken:
              tokenCallCount === 1 ? "initial-token" : "refreshed-token",
          }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    function RefreshTestComponent() {
      const { accessToken, refreshToken } = useAccessToken();

      return (
        <div>
          <div>Token: {accessToken || "none"}</div>
          <button onClick={refreshToken}>Refresh</button>
        </div>
      );
    }

    render(
      <TokenProvider>
        <RefreshTestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Token: initial-token")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    refreshButton.click();

    await waitFor(() => {
      expect(screen.getByText("Token: refreshed-token")).toBeInTheDocument();
    });

    // Should have called /api/logto/user once and /api/logto/token twice
    expect(tokenCallCount).toBe(2);
  });
});
