import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingCard } from "../loading-card";

describe("LoadingCard", () => {
  it("renders with default props", () => {
    render(<LoadingCard />);
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  it("displays custom message", () => {
    render(<LoadingCard message="Please wait..." />);
    expect(screen.getByText(/please wait.../i)).toBeInTheDocument();
  });

  it("renders with small size", () => {
    const { container } = render(<LoadingCard size="sm" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-8");
    expect(spinner).toHaveClass("w-8");
    expect(spinner).toHaveClass("border-2");
  });

  it("renders with medium size (default)", () => {
    const { container } = render(<LoadingCard size="md" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-12");
    expect(spinner).toHaveClass("w-12");
    expect(spinner).toHaveClass("border-b-2");
  });

  it("renders with large size", () => {
    const { container } = render(<LoadingCard size="lg" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-16");
    expect(spinner).toHaveClass("w-16");
    expect(spinner).toHaveClass("border-b-3");
  });

  it("has spinner with correct styling", () => {
    const { container } = render(<LoadingCard />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("rounded-full");
    expect(spinner).toHaveClass("border-blue-600");
    expect(spinner).toHaveClass("mx-auto");
    expect(spinner).toHaveClass("mb-4");
  });

  it("renders within a card container", () => {
    const { container } = render(<LoadingCard />);
    const card = container.querySelector(".card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("p-6");
    expect(card).toHaveClass("text-center");
  });

  it("message has correct styling", () => {
    render(<LoadingCard message="Custom message" />);
    const message = screen.getByText(/custom message/i);
    expect(message).toHaveClass("text-gray-600");
  });
});
