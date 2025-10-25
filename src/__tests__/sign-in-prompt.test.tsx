import React from "react";
import { render, screen } from "@testing-library/react";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";

describe("SignInPrompt", () => {
  it("renders default title, message and button", () => {
    render(<SignInPrompt />);
    expect(screen.getByText(/Sign in Required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please sign in to access the file upload dashboard/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign In/i })).toHaveAttribute(
      "href",
      "/api/logto/sign-in"
    );
  });

  it("renders custom props", () => {
    render(
      <SignInPrompt
        title="Hello"
        message="Custom message"
        buttonText="Authenticate"
        signInUrl="/custom"
      />
    );
    expect(screen.getByText(/Hello/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom message/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Authenticate/i })).toHaveAttribute(
      "href",
      "/custom"
    );
  });
});
