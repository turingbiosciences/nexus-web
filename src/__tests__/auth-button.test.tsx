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

  it("calls sign-out fetch on click when authenticated", () => {
    const fetchMock: jest.Mock = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200 });
    // Assign mock fetch (cast to unknown first to satisfy typing without any)
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    const btn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(btn);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/logto/sign-out",
      expect.any(Object)
    );
  });

  it("falls back to manual sign-out when standard sign-out fails", async () => {
    const fetchMock: jest.Mock = jest.fn();
    fetchMock.mockRejectedValueOnce(new Error("network error"));
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    const reloadSpy = jest.spyOn(window.location, "reload");
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await screen.findByRole("button", { name: /sign out/i });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/logto/sign-out");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/logto/manual-sign-out");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("reloads page after both standard and manual sign-out failures", async () => {
    const fetchMock: jest.Mock = jest.fn();
    // First standard sign-out error
    fetchMock.mockRejectedValueOnce(new Error("standard failure"));
    // Manual sign-out error
    fetchMock.mockRejectedValueOnce(new Error("manual failure"));
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    const reloadSpy = jest.spyOn(window.location, "reload");
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await screen.findByRole("button", { name: /sign out/i });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/logto/sign-out");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/logto/manual-sign-out");
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("does not attempt manual sign-out when status is 307", () => {
    const fetchMock: jest.Mock = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 307 });
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    mockedUseGlobalAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });
    render(<AuthButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    // Only one fetch call (no manual fallback)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
