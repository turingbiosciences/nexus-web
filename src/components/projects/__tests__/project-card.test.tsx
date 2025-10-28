import { render, screen } from "@testing-library/react";
import { ProjectCard } from "../project-card";
import { Project } from "@/types/project";

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "Link";
  return MockLink;
});

describe("ProjectCard", () => {
  const baseProject: Project = {
    id: "test-project-1",
    name: "Test Project",
    description: "A test project description",
    status: "running",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    datasetCount: 5,
    lastActivity: "2 days ago",
  };

  it("renders project name", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("renders project description", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it("renders dataset count when provided", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText("5 datasets")).toBeInTheDocument();
  });

  it("does not render dataset count when undefined", () => {
    const projectWithoutCount = { ...baseProject, datasetCount: undefined };
    render(<ProjectCard project={projectWithoutCount} />);
    expect(screen.queryByText(/datasets/)).not.toBeInTheDocument();
  });

  it("renders last activity when provided", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
  });

  it("does not render last activity when undefined", () => {
    const projectWithoutActivity = { ...baseProject, lastActivity: undefined };
    render(<ProjectCard project={projectWithoutActivity} />);
    expect(screen.queryByText("2 days ago")).not.toBeInTheDocument();
  });

  it("renders complete status with correct styling", () => {
    const completeProject: Project = { ...baseProject, status: "complete" };
    render(<ProjectCard project={completeProject} />);

    const statusBadge = screen.getByText("Complete").parentElement;
    expect(statusBadge).toHaveClass("bg-green-50", "text-green-600");
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("renders running status with correct styling", () => {
    render(<ProjectCard project={baseProject} />);

    const statusBadge = screen.getByText("Running").parentElement;
    expect(statusBadge).toHaveClass("bg-blue-50", "text-blue-600");
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("renders setup status with correct styling", () => {
    const setupProject: Project = { ...baseProject, status: "setup" };
    render(<ProjectCard project={setupProject} />);

    const statusBadge = screen.getByText("Setup").parentElement;
    expect(statusBadge).toHaveClass("bg-yellow-50", "text-yellow-600");
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("links to project detail page", () => {
    render(<ProjectCard project={baseProject} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/test-project-1");
  });

  it("truncates long project names", () => {
    const longNameProject = {
      ...baseProject,
      name: "This is a very long project name that should be truncated",
    };
    render(<ProjectCard project={longNameProject} />);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("truncate");
  });

  it("clamps description to 2 lines", () => {
    const longDescProject = {
      ...baseProject,
      description:
        "This is a very long description that should be clamped to two lines maximum and anything beyond that should not be visible to the user",
    };
    render(<ProjectCard project={longDescProject} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass("line-clamp-2");
  });

  it("applies hover effect classes", () => {
    const { container } = render(<ProjectCard project={baseProject} />);

    const card = container.querySelector(".card");
    expect(card).toHaveClass("hover:shadow-lg", "transition-shadow");
  });

  it("renders with cursor pointer", () => {
    const { container } = render(<ProjectCard project={baseProject} />);

    const card = container.querySelector(".card");
    expect(card).toHaveClass("cursor-pointer");
  });

  it("renders all status icons correctly", () => {
    const { rerender } = render(
      <ProjectCard project={{ ...baseProject, status: "complete" }} />
    );
    expect(screen.getByText("Complete")).toBeInTheDocument();

    rerender(<ProjectCard project={{ ...baseProject, status: "running" }} />);
    expect(screen.getByText("Running")).toBeInTheDocument();

    rerender(<ProjectCard project={{ ...baseProject, status: "setup" }} />);
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("renders with minimum required fields only", () => {
    const minimalProject: Project = {
      id: "minimal-1",
      name: "Minimal Project",
      description: "Minimal description",
      status: "setup",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<ProjectCard project={minimalProject} />);

    expect(screen.getByText("Minimal Project")).toBeInTheDocument();
    expect(screen.getByText("Minimal description")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();
    expect(screen.queryByText(/datasets/)).not.toBeInTheDocument();
  });
});
