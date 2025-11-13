import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ResultsSection } from "../results-section";
import { useAccessToken } from "@/components/providers/token-provider";
import { useQuery } from "@tanstack/react-query";

// Mock dependencies
jest.mock("@/components/providers/token-provider");
jest.mock("@tanstack/react-query");

const mockUseAccessToken = useAccessToken as jest.MockedFunction<
  typeof useAccessToken
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe("ResultsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";
    mockUseAccessToken.mockReturnValue({
      accessToken: "mock-token",
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
      isAuthenticated: true,
      authLoading: false,
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TURING_API;
  });

  it("renders loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders empty state when no results", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(screen.getByText("No results available yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Results will appear here once analysis is complete.")
    ).toBeInTheDocument();
  });

  it("renders results list", () => {
    const results = [
      {
        id: "1",
        name: "Result 1",
        type: "Analysis Type A",
        createdAt: "2024-01-01T10:00:00Z",
      },
      {
        id: "2",
        name: "Result 2",
        type: "Analysis Type B",
        createdAt: "2024-01-02T11:00:00Z",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: results,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText("Result 1")).toBeInTheDocument();
    expect(screen.getByText("Analysis Type A")).toBeInTheDocument();
    expect(screen.getByText("Result 2")).toBeInTheDocument();
    expect(screen.getByText("Analysis Type B")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    const results = [
      {
        id: "1",
        name: "Result 1",
        type: "Analysis",
        createdAt: "2024-01-15T10:00:00Z",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: results,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    // Date should be formatted using toLocaleDateString
    const dateElement = screen.getByText(/1\/15\/2024/);
    expect(dateElement).toBeInTheDocument();
  });

  it("shows hover effect on result items", () => {
    const results = [
      {
        id: "1",
        name: "Result 1",
        type: "Analysis",
        createdAt: "2024-01-01T10:00:00Z",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: results,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    const resultItem = container.querySelector(".hover\\:bg-gray-50");
    expect(resultItem).toBeInTheDocument();
  });

  it("disables query when not authenticated", () => {
    mockUseAccessToken.mockReturnValue({
      accessToken: null,
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
      isAuthenticated: false,
      authLoading: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("disables query when no access token", () => {
    mockUseAccessToken.mockReturnValue({
      accessToken: null,
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
      isAuthenticated: true,
      authLoading: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("uses correct query key", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="my-project-123" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["results", "my-project-123"],
      })
    );
  });

  it("sets staleTime to 30 seconds", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 30_000,
      })
    );
  });

  it("displays SVG icon in empty state", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("h-12", "w-12");
  });

  it("renders multiple results correctly", () => {
    const results = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      name: `Result ${i}`,
      type: "Analysis",
      createdAt: "2024-01-01T10:00:00Z",
    }));

    mockUseQuery.mockReturnValue({
      data: results,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ResultsSection projectId="test-project-id" />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(5);
  });
});
