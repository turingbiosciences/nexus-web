import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  GlobalAuthProvider,
  useGlobalAuth,
} from "@/components/providers/global-auth-provider";

// Mock @logto/react hook
jest.mock("@logto/react", () => ({
  useLogto: () => ({
    isAuthenticated: true,
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    fetchUserInfo: jest.fn(),
    getIdTokenClaims: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue("token123"),
  }),
}));

// Component to read context
function Consumer() {
  const { isAuthenticated, isLoading, getAccessToken } = useGlobalAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="loading">{isLoading ? "loading" : "ready"}</span>
      <button
        onClick={async () => {
          const token = await getAccessToken();
          console.log("token", token);
        }}
      >
        token
      </button>
    </div>
  );
}

describe("GlobalAuthProvider", () => {
  it("provides auth context values (authenticated)", async () => {
    // Polyfill fetch for provider's refreshAuth call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isAuthenticated: true, claims: { sub: "123" } }),
    });
    render(
      <GlobalAuthProvider>
        <Consumer />
      </GlobalAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
  });

  it("reports unauthenticated when server responds non-ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    render(
      <GlobalAuthProvider>
        <Consumer />
      </GlobalAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });
  });

  it("handles fetch rejection gracefully", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    render(
      <GlobalAuthProvider>
        <Consumer />
      </GlobalAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });
  });
});
