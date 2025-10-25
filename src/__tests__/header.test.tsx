import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/header";
import React from "react";

// Mock AuthButton to avoid auth logic complexity
jest.mock("@/components/auth/auth-button", () => ({
  AuthButton: () => <button>Mock Sign In</button>,
})); // Mock is automatically hoisted by Jest; no direct import needed

// Mock Logo component
jest.mock("@/components/ui/logo", () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

describe("Header", () => {
  it("renders logo and auth button", () => {
    render(<Header />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mock sign in/i })
    ).toBeInTheDocument();
  });
});
