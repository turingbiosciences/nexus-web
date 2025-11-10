import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/components/auth/auth-provider";

// Mock LogtoProvider to observe config
interface MockConfig {
  endpoint: string;
  appId: string;
  scopes: string[];
  resources?: string[];
}

// Mock the auth config
jest.mock("@/lib/auth", () => ({
  logtoClientConfig: {
    endpoint: "https://logto.example.com",
    appId: "app_123",
    scopes: ["openid", "profile", "email", "offline_access", "all"],
    resources: ["https://api.example.com"],
  },
}));

jest.mock("@logto/react", () => ({
  LogtoProvider: ({
    children,
    config,
  }: {
    children: React.ReactNode;
    config: MockConfig;
  }) => (
    <div
      data-testid="logto-provider"
      data-endpoint={config.endpoint}
      data-appid={config.appId}
      data-scopes={config.scopes?.join(",")}
    >
      {children}
    </div>
  ),
}));

describe("AuthProvider", () => {
  it("passes config to LogtoProvider and renders children", () => {
    render(
      <AuthProvider>
        <span data-testid="child">Child</span>
      </AuthProvider>
    );
    const provider = screen.getByTestId("logto-provider");
    expect(provider).toHaveAttribute(
      "data-endpoint",
      "https://logto.example.com"
    );
    expect(provider).toHaveAttribute("data-appid", "app_123");
    expect(provider).toHaveAttribute(
      "data-scopes",
      "openid,profile,email,offline_access,all"
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
