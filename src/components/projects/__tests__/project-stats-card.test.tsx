import React from "react";
import { render, screen } from "@testing-library/react";
import { ProjectStatsCard } from "../project-stats-card";
import { Project } from "@/types/project";

// Mock the projects provider
jest.mock("@/components/providers/projects-provider", () => ({
  useProjects: jest.fn(),
}));

const mockedUseProjects = jest.requireMock(
  "@/components/providers/projects-provider"
).useProjects;

describe("ProjectStatsCard", () => {
  const baseProject: Project = {
    id: "project-1",
    name: "Test Project",
    description: "Test project description",
    status: "setup",
    datasetCount: 3,
    completedAt: new Date("2024-06-15T12:00:00"),
    createdAt: new Date("2024-01-15T12:00:00"),
    updatedAt: new Date("2024-06-10T12:00:00"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the component title", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Project Statistics")).toBeInTheDocument();
    });

    it("renders all six statistic items", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Current Status")).toBeInTheDocument();
      expect(screen.getByText("Last Project Run")).toBeInTheDocument();
      expect(screen.getByText("Number of Runs")).toBeInTheDocument();
      expect(screen.getByText("Number of Datasets")).toBeInTheDocument();
      expect(screen.getByText("Last Updated")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
    });

    it("returns null when project is not found", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(null),
      });

      const { container } = render(<ProjectStatsCard projectId="non-existent" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Status Display", () => {
    it("displays 'Setup' status with yellow styling for setup projects", () => {
      const setupProject: Project = { ...baseProject, status: "setup" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(setupProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const statusBadge = screen.getByText("Setup");
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass("bg-yellow-50", "text-yellow-600");
    });

    it("displays 'Complete' status with green styling for complete projects", () => {
      const completeProject: Project = { ...baseProject, status: "complete" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(completeProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const statusBadge = screen.getByText("Complete");
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass("bg-green-50", "text-green-600");
    });

    it("displays 'Running' status with blue styling for running projects", () => {
      const runningProject: Project = { ...baseProject, status: "running" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(runningProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const statusBadge = screen.getByText("Running");
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass("bg-blue-50", "text-blue-600");
    });
  });

  describe("Last Project Run Display", () => {
    it("displays formatted date when completedAt is set", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Jun 15, 2024")).toBeInTheDocument();
    });

    it("displays 'Never' when completedAt is not set", () => {
      const projectWithoutCompletion: Project = {
        ...baseProject,
        completedAt: undefined,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithoutCompletion),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Never")).toBeInTheDocument();
    });
  });

  describe("Number of Runs Display", () => {
    it("displays 0 for run count (placeholder)", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      // Find the Number of Runs row and verify it shows 0
      const runCountRow = screen
        .getByText("Number of Runs")
        .closest("div")!
        .parentElement;
      expect(runCountRow).toHaveTextContent("0");
    });
  });

  describe("Dataset Count Display", () => {
    it("displays dataset count when present", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText("Number of Datasets")
        .closest("div")!
        .parentElement;
      expect(datasetRow).toHaveTextContent("3");
    });

    it("displays 0 when datasetCount is undefined", () => {
      const projectWithoutDatasets: Project = {
        ...baseProject,
        datasetCount: undefined,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithoutDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText("Number of Datasets")
        .closest("div")!
        .parentElement;
      expect(datasetRow).toHaveTextContent("0");
    });

    it("displays 0 when datasetCount is 0", () => {
      const projectWithZeroDatasets: Project = {
        ...baseProject,
        datasetCount: 0,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithZeroDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText("Number of Datasets")
        .closest("div")!
        .parentElement;
      expect(datasetRow).toHaveTextContent("0");
    });
  });

  describe("Date Formatting", () => {
    it("formats Last Updated date correctly", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Jun 10, 2024")).toBeInTheDocument();
    });

    it("formats Created date correctly", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    });
  });

  describe("Visual Structure", () => {
    it("renders all statistics with icons", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      // Check for SVG icons (lucide-react renders as SVG elements)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });

    it("renders statistics in vertical list with borders", () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      const statsRows = container.querySelectorAll(".py-3");
      expect(statsRows.length).toBe(6); // 6 statistics rows
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum dataset count", () => {
      const projectWithMaxDatasets: Project = {
        ...baseProject,
        datasetCount: 9999,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithMaxDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText("Number of Datasets")
        .closest("div")!
        .parentElement;
      expect(datasetRow).toHaveTextContent("9999");
    });

    it("renders with same-day createdAt and updatedAt dates", () => {
      const sameDate = new Date("2024-06-15T12:00:00");
      const projectWithSameDate: Project = {
        ...baseProject,
        createdAt: sameDate,
        updatedAt: sameDate,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithSameDate),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      // Should render both dates even though they're the same
      const dateElements = screen.getAllByText("Jun 15, 2024");
      expect(dateElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Status Icon Rendering", () => {
    it("renders CheckCircle icon for complete status", () => {
      const completeProject: Project = { ...baseProject, status: "complete" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(completeProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      // CheckCircle icon is rendered with text-green-600 class
      const greenIcon = container.querySelector(".text-green-600");
      expect(greenIcon).toBeInTheDocument();
    });

    it("renders Play icon for running status", () => {
      const runningProject: Project = { ...baseProject, status: "running" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(runningProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      // Play icon is rendered with text-blue-600 class
      const blueIcon = container.querySelector(".text-blue-600");
      expect(blueIcon).toBeInTheDocument();
    });

    it("renders Settings2 icon for setup status", () => {
      const setupProject: Project = { ...baseProject, status: "setup" };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(setupProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      // Settings2 icon is rendered with text-yellow-600 class
      const yellowIcon = container.querySelector(".text-yellow-600");
      expect(yellowIcon).toBeInTheDocument();
    });
  });
});
