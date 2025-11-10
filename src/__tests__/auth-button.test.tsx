import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthButton } from "@/components/auth/auth-button";

// Mock the global auth provider hook used by AuthButton
jest.mock("@/components/providers/global-auth-provider", () => ({
  useGlobalAuth: jest.fn(),
}));

import { useGlobalAuth } from "@/components/providers/global-auth-provider";
const mockedUseGlobalAuth = useGlobalAuth as jest.Mock;

describe("AuthButton", () => {
  beforeEach(() => {
    mockedUseGlobalAuth.mockReset();
    // Make window.location.href writable for redirect tests
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/", reload: jest.fn() },
      writable: true,
    });
  });

  it("renders loading state when isLoading", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
    });
    render(<AuthButton />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders sign in when unauthenticated", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    });
    render(<AuthButton />);
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("redirects to sign-in route on click when unauthenticated", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    });
    render(<AuthButton />);
    const btn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(btn);
    expect(window.location.href).toContain("/api/logto/sign-in");
  });

  it("renders sign out when authenticated", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("redirects to sign-out route on click when authenticated", () => {
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    const btn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(btn);
    expect(window.location.href).toContain("/api/logto/sign-out");
  });
});
