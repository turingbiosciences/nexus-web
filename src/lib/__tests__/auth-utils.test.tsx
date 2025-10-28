import { GlobalAuthProvider, useGlobalAuth } from "@/lib/auth-utils";
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { getAuthStateSnapshot, checkAuth } from "@/lib/auth-utils";

// Allow per-test customization of the Logto hook output.
const mockUseLogto = jest.fn();

jest.mock("@logto/react", () => ({
  useLogto: () => mockUseLogto(),
}));

function Consumer() {
  const { isAuthenticated, isLoading } = useGlobalAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="loading">{isLoading ? "loading" : "ready"}</span>
    </div>
  );
}

describe("auth-utils", () => {
  beforeEach(() => {
    mockUseLogto.mockReset();
  });

  it("snapshot reflects initial cached state", () => {
    // Before any provider mounts the module-level cache should have defaults.
    const snap = getAuthStateSnapshot();
    expect(snap.isAuthenticated).toBe(false);
    expect(snap.isLoading).toBe(true);
  });

  it("provider updates snapshot after mount (authenticated, ready)", async () => {
    mockUseLogto.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getAccessToken: jest.fn().mockResolvedValue("token-abc"),
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ claims: { sub: "xyz" } }) });

    render(
      <GlobalAuthProvider>
        <Consumer />
      </GlobalAuthProvider>
    );

    await waitFor(() => {
      const snap = getAuthStateSnapshot();
      expect(snap.isLoading).toBe(false);
      expect(snap.isAuthenticated).toBe(true);
    });
  });

  it("checkAuth falls back to network when still loading", async () => {
    mockUseLogto.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      getAccessToken: jest.fn().mockResolvedValue("token-abc"),
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const result = await checkAuth();
    expect(result).toBe(true);
  });
});
