import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/footer";
import React from "react";

const THIS_YEAR = new Date().getFullYear();

describe("Footer", () => {
  it("renders current year and company", () => {
    render(<Footer />);
    expect(
      screen.getByText(new RegExp(`${THIS_YEAR} Turing Biosciences`, "i"))
    ).toBeInTheDocument();
  });

  it("matches snapshot", () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
