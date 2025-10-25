import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/components/auth/auth-provider";

// Mock LogtoProvider to observe config
interface MockConfig {
  endpoint: string;
  appId: string;
  scopes: string[];
}
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
    >
      {children}
    </div>
  ),
}));

describe("AuthProvider", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_LOGTO_ENDPOINT = "https://logto.example.com";
    process.env.NEXT_PUBLIC_LOGTO_APP_ID = "app_123";
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

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
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
