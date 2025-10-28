import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Dummy } from "../dummy";

// Prepare a mock for the auth hook we can reconfigure per test
const mockUseGlobalAuth = jest.fn();
jest.mock("@/components/providers/global-auth-provider", () => ({
  useGlobalAuth: () => mockUseGlobalAuth(),
}));

describe("Dummy", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Ensure fetch exists for spy/stubbing
  global.fetch = jest.fn();
  });

  it("shows loading state while provider loading", () => {
    mockUseGlobalAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(<Dummy />);
    expect(screen.getByText(/loading authentication/i)).toBeInTheDocument();
  });

  it("shows authenticated immediately when provider reports authenticated", async () => {
    mockUseGlobalAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(<Dummy />);
    await waitFor(() => {
      expect(screen.getByText(/authenticated/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/loading authentication/i)).not.toBeInTheDocument();
  });

  it("attempts bridge fetch and resolves authenticated on 200", async () => {
    mockUseGlobalAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    render(<Dummy />);
    await waitFor(() => {
      expect(screen.getByText(/authenticated/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/logto/user", expect.any(Object));
  });

  it("attempts bridge fetch and resolves not authenticated on network error", async () => {
    mockUseGlobalAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network"));
    render(<Dummy />);
    await waitFor(() => {
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("resolves not authenticated when bridge returns non-200", async () => {
    mockUseGlobalAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<Dummy />);
    await waitFor(() => {
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalled();
  });
});
