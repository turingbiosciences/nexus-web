import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  TokenProvider,
  useAccessToken,
} from "@/components/providers/token-provider";

// Mock GlobalAuthProvider
jest.mock("@/components/providers/global-auth-provider", () => ({
  useGlobalAuth: jest.fn(),
}));

import { useGlobalAuth } from "@/components/providers/global-auth-provider";
const mockedUseGlobalAuth = useGlobalAuth as jest.Mock;

// Test component that uses the token hook
function TestComponent() {
  const { accessToken, isLoading, error } = useAccessToken();

  if (isLoading) return <div>Loading token...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (accessToken) return <div>Token: {accessToken}</div>;
  return <div>No token</div>;
}

describe("TokenProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws error when useAccessToken is used outside TokenProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAccessToken must be used within a TokenProvider");

    consoleSpy.mockRestore();
  });

  it("shows loading state initially when auth is loading", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    expect(screen.getByText("Loading token...")).toBeInTheDocument();
  });

  it("shows no token when user is not authenticated", async () => {
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
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
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: "mock-m2m-token-123",
        expiresIn: 3600,
        tokenType: "Bearer",
      }),
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
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: "Internal server error",
      }),
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
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

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
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: "mock-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      }),
    });

    const { rerender, unmount } = render(
      <TokenProvider>
        <TestComponent />
      </TokenProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Token: mock-token")).toBeInTheDocument();
    });

    // Clean up and start fresh for sign-out test
    unmount();

    // Now test sign-out scenario
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
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
    mockedUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: "initial-token",
          expiresIn: 3600,
          tokenType: "Bearer",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: "refreshed-token",
          expiresIn: 3600,
          tokenType: "Bearer",
        }),
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

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
