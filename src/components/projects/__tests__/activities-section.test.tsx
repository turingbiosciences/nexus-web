import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ActivitiesSection } from "../activities-section";
import { useActivities } from "@/lib/queries/activities";
import { useProjects } from "@/components/providers/projects-provider";

// Mock the hooks
jest.mock("@/lib/queries/activities");
jest.mock("@/components/providers/projects-provider");

const mockUseActivities = useActivities as jest.MockedFunction<
  typeof useActivities
>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

describe("ActivitiesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useProjects to return minimal required data
    mockUseProjects.mockReturnValue({
      updateProject: jest.fn(),
      getProjectById: jest.fn().mockReturnValue({
        id: "test-project-id",
        name: "Test Project",
        lastActivity: "No recent activity",
      }),
    } as any);
  });

  it("renders loading state", () => {
    mockUseActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no activities", () => {
    mockUseActivities.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("renders activities list", () => {
    const activities = [
      {
        id: "1",
        message: "Dataset uploaded",
        type: "upload" as const,
        at: new Date("2024-01-01T10:00:00Z"),
      },
      {
        id: "2",
        message: "Status changed to processing",
        type: "status_change" as const,
        at: new Date("2024-01-02T11:00:00Z"),
      },
      {
        id: "3",
        message: "Analysis completed",
        type: "created" as const,
        at: new Date("2024-01-03T12:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    expect(screen.getByText("Dataset uploaded")).toBeInTheDocument();
    expect(
      screen.getByText("Status changed to processing")
    ).toBeInTheDocument();
    expect(screen.getByText("Analysis completed")).toBeInTheDocument();
  });

  it("sorts activities by date descending", () => {
    const activities = [
      {
        id: "1",
        message: "First activity",
        type: "upload",
        at: new Date("2024-01-01T10:00:00Z"),
      },
      {
        id: "2",
        message: "Second activity",
        type: "upload",
        at: new Date("2024-01-03T10:00:00Z"),
      },
      {
        id: "3",
        message: "Third activity",
        type: "upload",
        at: new Date("2024-01-02T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0]).toHaveTextContent("Second activity");
    expect(listItems[1]).toHaveTextContent("Third activity");
    expect(listItems[2]).toHaveTextContent("First activity");
  });

  it("respects limit prop", () => {
    const activities = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`,
      message: `Activity ${i}`,
      type: "upload",
      at: new Date(`2024-01-${i + 1}T10:00:00Z`),
    }));

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" limit={5} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(5);
  });

  it("uses default limit of 20", () => {
    const activities = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`,
      message: `Activity ${i}`,
      type: "upload",
      at: new Date(`2024-01-${i + 1}T10:00:00Z`),
    }));

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(20);
  });

  it("applies correct color for upload activity", () => {
    const activities = [
      {
        id: "1",
        message: "Upload activity",
        type: "upload",
        at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ActivitiesSection projectId="test-project-id" />
    );

    const indicator = container.querySelector(".bg-blue-500");
    expect(indicator).toBeInTheDocument();
  });

  it("applies correct color for status_change activity", () => {
    const activities = [
      {
        id: "1",
        message: "Status change",
        type: "status_change",
        at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ActivitiesSection projectId="test-project-id" />
    );

    const indicator = container.querySelector(".bg-yellow-500");
    expect(indicator).toBeInTheDocument();
  });

  it("applies correct color for delete activity", () => {
    const activities = [
      {
        id: "1",
        message: "Delete activity",
        type: "delete",
        at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ActivitiesSection projectId="test-project-id" />
    );

    const indicator = container.querySelector(".bg-red-500");
    expect(indicator).toBeInTheDocument();
  });

  it("applies correct color for updated activity", () => {
    const activities = [
      {
        id: "1",
        message: "Updated activity",
        type: "updated",
        at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ActivitiesSection projectId="test-project-id" />
    );

    const indicator = container.querySelector(".bg-gray-400");
    expect(indicator).toBeInTheDocument();
  });

  it("applies correct color for completed activity", () => {
    const activities = [
      {
        id: "1",
        message: "Completed activity",
        type: "completed",
        at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <ActivitiesSection projectId="test-project-id" />
    );

    const indicator = container.querySelector(".bg-green-500");
    expect(indicator).toBeInTheDocument();
  });

  it("formats date correctly", () => {
    const activities = [
      {
        id: "1",
        message: "Test activity",
        type: "upload",
        at: new Date("2024-01-15T14:30:00Z"),
      },
    ];

    mockUseActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="test-project-id" />);

    // Date should be formatted using toLocaleString
    const dateText = screen.getByText(/2024/);
    expect(dateText).toBeInTheDocument();
  });

  it("passes projectId to useActivities hook", () => {
    mockUseActivities.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="my-project-123" />);

    expect(mockUseActivities).toHaveBeenCalledWith("my-project-123", {
      limit: 20,
    });
  });

  it("passes custom limit to useActivities hook", () => {
    mockUseActivities.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<ActivitiesSection projectId="my-project-123" limit={10} />);

    expect(mockUseActivities).toHaveBeenCalledWith("my-project-123", {
      limit: 10,
    });
  });
});
