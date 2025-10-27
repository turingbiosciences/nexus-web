import React from "react";
import { render, screen } from "@testing-library/react";
import { Logo } from "../logo";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("Logo", () => {
  it("renders logo image", () => {
    render(<Logo />);
    const logo = screen.getByAltText(/turing biosciences/i);
    expect(logo).toBeInTheDocument();
  });

  it("has correct src attribute", () => {
    render(<Logo />);
    const logo = screen.getByAltText(/turing biosciences/i);
    expect(logo).toHaveAttribute("src", "/turing-biosciences-logo.svg");
  });

  it("has correct default dimensions", () => {
    render(<Logo />);
    const logo = screen.getByAltText(/turing biosciences/i);
    expect(logo).toHaveAttribute("width", "200");
    expect(logo).toHaveAttribute("height", "48");
  });

  it("applies default className", () => {
    render(<Logo />);
    const logo = screen.getByAltText(/turing biosciences/i);
    expect(logo).toHaveClass("h-12");
    expect(logo).toHaveClass("w-auto");
  });

  it("applies custom className", () => {
    render(<Logo className="h-8 w-16" />);
    const logo = screen.getByAltText(/turing biosciences/i);
    expect(logo).toHaveClass("h-8");
    expect(logo).toHaveClass("w-16");
  });

  it("has style attribute for auto dimensions", () => {
    const { container } = render(<Logo />);
    const logo = container.querySelector("img");
    expect(logo).toHaveStyle({ width: "auto", height: "auto" });
  });
});
