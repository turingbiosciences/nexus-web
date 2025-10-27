import { render, screen } from "@testing-library/react";
import { ProjectStatusChart } from "../project-status-chart";
import { ProjectStatusCount } from "@/types/project";

describe("ProjectStatusChart", () => {
  it("renders chart with all status types", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 3,
      setup: 2,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Project Status Overview")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // Total
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("displays correct status labels and counts", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 3,
      setup: 2,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();

    // Check for the count values
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calculates and displays correct percentages", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 3,
      setup: 2,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("50.0%")).toBeInTheDocument(); // 5/10
    expect(screen.getByText("30.0%")).toBeInTheDocument(); // 3/10
    expect(screen.getByText("20.0%")).toBeInTheDocument(); // 2/10
  });

  it("shows empty state when no projects exist", () => {
    const statusCount: ProjectStatusCount = {
      complete: 0,
      running: 0,
      setup: 0,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Project Status")).toBeInTheDocument();
    expect(screen.getByText("No projects to display")).toBeInTheDocument();
    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
  });

  it("does not render status rows with zero count", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 0,
      setup: 0,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByText("Setup")).not.toBeInTheDocument();

    // Count appears in both total and status row
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("100.0%")).toBeInTheDocument(); // Only complete
  });

  it("renders all statuses when all have non-zero counts", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1,
      running: 1,
      setup: 1,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();

    // All should show 33.3% (1/3)
    const percentages = screen.getAllByText("33.3%");
    expect(percentages).toHaveLength(3);
  });

  it("displays total count correctly", () => {
    const statusCount: ProjectStatusCount = {
      complete: 15,
      running: 8,
      setup: 7,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("30")).toBeInTheDocument(); // 15+8+7
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("handles large numbers correctly", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1000,
      running: 500,
      setup: 250,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("1750")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("renders pie chart with correct styling", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 3,
      setup: 2,
    };

    const { container } = render(
      <ProjectStatusChart statusCount={statusCount} />
    );

    // Check for pie chart container
    const pieChart = container.querySelector(".rounded-full");
    expect(pieChart).toBeInTheDocument();
    expect(pieChart).toHaveClass("w-48", "h-48");
  });

  it("renders color indicators for each status", () => {
    const statusCount: ProjectStatusCount = {
      complete: 5,
      running: 3,
      setup: 2,
    };

    const { container } = render(
      <ProjectStatusChart statusCount={statusCount} />
    );

    // Each status row should have a colored circle indicator
    const colorIndicators = container.querySelectorAll(".w-3.h-3.rounded-full");
    expect(colorIndicators.length).toBeGreaterThan(0);
  });

  it("formats percentage with one decimal place", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1,
      running: 2,
      setup: 0,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("33.3%")).toBeInTheDocument(); // 1/3
    expect(screen.getByText("66.7%")).toBeInTheDocument(); // 2/3
  });

  it("renders card with correct title", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1,
      running: 1,
      setup: 1,
    };

    const { container } = render(
      <ProjectStatusChart statusCount={statusCount} />
    );

    const title = screen.getByText("Project Status Overview");
    expect(title).toHaveClass("card-title");

    const card = container.querySelector(".card");
    expect(card).toBeInTheDocument();
  });

  it("displays status icons", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1,
      running: 1,
      setup: 1,
    };

    const { container } = render(
      <ProjectStatusChart statusCount={statusCount} />
    );

    // Lucide icons render as SVG elements
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("handles single status type", () => {
    const statusCount: ProjectStatusCount = {
      complete: 0,
      running: 10,
      setup: 0,
    };

    render(<ProjectStatusChart statusCount={statusCount} />);

    expect(screen.getByText("Running")).toBeInTheDocument();
    // Count appears in both total and status row
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    expect(screen.queryByText("Setup")).not.toBeInTheDocument();
  });

  it("maintains status order: complete, running, setup", () => {
    const statusCount: ProjectStatusCount = {
      complete: 1,
      running: 2,
      setup: 3,
    };

    const { container } = render(
      <ProjectStatusChart statusCount={statusCount} />
    );

    const statusLabels = container.querySelectorAll(".text-sm.font-medium");
    const labelTexts = Array.from(statusLabels).map((el) => el.textContent);

    const completeIndex = labelTexts.indexOf("Complete");
    const runningIndex = labelTexts.indexOf("Running");
    const setupIndex = labelTexts.indexOf("Setup");

    expect(completeIndex).toBeLessThan(runningIndex);
    expect(runningIndex).toBeLessThan(setupIndex);
  });
});
