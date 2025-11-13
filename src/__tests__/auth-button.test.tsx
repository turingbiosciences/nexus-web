import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthButton } from "@/components/auth/auth-button";

// Mock the token provider hook used by AuthButton
jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: jest.fn(),
}));

import { useAccessToken } from "@/components/providers/token-provider";
const mockedUseAccessToken = useAccessToken as jest.Mock;

describe("AuthButton", () => {
  beforeEach(() => {
    mockedUseAccessToken.mockReset();
    // Make window.location.href writable for redirect tests
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/", reload: jest.fn() },
      writable: true,
    });
  });

  it("renders loading state when isLoading", () => {
    mockedUseAccessToken.mockReturnValue({
      authLoading: true,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });
    render(<AuthButton />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders sign in when unauthenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      authLoading: false,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });
    render(<AuthButton />);
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("redirects to sign-in route on click when unauthenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      authLoading: false,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });
    render(<AuthButton />);
    const btn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(btn);
    expect(window.location.href).toContain("/api/logto/sign-in");
  });

  it("renders sign out when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      authLoading: false,
      isAuthenticated: true,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });
    render(<AuthButton />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("redirects to sign-out route on click when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      authLoading: false,
      isAuthenticated: true,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });
    render(<AuthButton />);
    const btn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(btn);
    expect(window.location.href).toContain("/api/logto/sign-out");
  });
});
