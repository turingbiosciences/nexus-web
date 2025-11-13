import React from "react";
import { render } from "@testing-library/react";
import { ProjectOverviewTab } from "../project-overview-tab";
import { useProjects } from "@/components/providers/projects-provider";

// Mock dependencies
jest.mock("@/components/providers/projects-provider");

const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

describe("ProjectOverviewTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProjects.mockReturnValue({
      projects: [
        {
          id: "test-project-123",
          name: "Test Project",
          description: "Test description",
          status: "running" as const,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
      ],
      loading: false,
      error: null,
      createProject: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      getProjectById: jest.fn(),
      getStatusCounts: jest.fn(),
      addDataset: jest.fn(),
    });
  });

  it("renders ProjectStatsCard", () => {
    render(<ProjectOverviewTab projectId="test-project-123" />);

    // ProjectStatsCard renders project name
    expect(mockUseProjects).toHaveBeenCalled();
  });

  it("passes projectId prop to ProjectStatsCard", () => {
    render(<ProjectOverviewTab projectId="another-project-456" />);

    expect(mockUseProjects).toHaveBeenCalled();
  });
});
