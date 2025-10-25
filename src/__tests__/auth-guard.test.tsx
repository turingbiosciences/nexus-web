import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthGuard, useAuth } from "@/components/auth/auth-guard";

jest.mock("@logto/react", () => ({
  useLogto: () => ({
    isAuthenticated: true,
    isLoading: false,
    getAccessToken: async () => "token-123",
  }),
}));

function Consumer() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="loading">{isLoading ? "loading" : "ready"}</span>
      <button
        data-testid="token-btn"
        onClick={async () => {
          await getAccessToken();
        }}
      >
        Get Token
      </button>
    </div>
  );
}

describe("AuthGuard", () => {
  it("provides auth context values to children", () => {
    render(
      <AuthGuard>
        <Consumer />
      </AuthGuard>
    );
    expect(screen.getByTestId("auth").textContent).toBe("yes");
    expect(screen.getByTestId("loading").textContent).toBe("ready");
    expect(screen.getByTestId("token-btn")).toBeInTheDocument();
  });
});
