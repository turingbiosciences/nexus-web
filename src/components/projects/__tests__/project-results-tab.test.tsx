import React from "react";
import { render, screen } from "@testing-library/react";
import { ProjectResultsTab } from "../project-results-tab";
import { useAccessToken } from "@/components/providers/token-provider";

// Mock dependencies
jest.mock("@/components/providers/token-provider");
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

const mockUseAccessToken = useAccessToken as jest.MockedFunction<
  typeof useAccessToken
>;

describe("ProjectResultsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessToken.mockReturnValue({
      accessToken: "mock-token",
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
      isAuthenticated: true,
      authLoading: false,
    });
  });

  it("renders ResultsSection with projectId", () => {
    render(<ProjectResultsTab projectId="test-project-123" />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
  });

  it("passes projectId prop to ResultsSection", () => {
    render(<ProjectResultsTab projectId="another-project-456" />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
  });
});
