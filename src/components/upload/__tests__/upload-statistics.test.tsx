import React from "react";
import { render, screen } from "@testing-library/react";
import { UploadStatistics } from "../upload-statistics";

describe("UploadStatistics", () => {
  it("renders heading and default stats", () => {
    render(<UploadStatistics />);
    expect(
      screen.getByRole("heading", { name: /upload statistics/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/total files/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // default totalFiles
    expect(screen.getByText(/total size/i)).toBeInTheDocument();
    expect(screen.getByText(/0 mb/i)).toBeInTheDocument();
    expect(screen.getByText(/successful uploads/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders provided totalFiles prop", () => {
    render(<UploadStatistics totalFiles={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
