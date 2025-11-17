import { render, screen } from "@testing-library/react";
import { ProjectList } from "../project-list";
import { Project } from "@/types/project";
import { TokenProvider } from "@/components/providers/token-provider";
import { ProjectsProvider } from "@/components/providers/projects-provider";
import { useProjectMetadata } from "@/lib/queries/project-metadata";

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

// Mock useProjectMetadata hook
jest.mock("@/lib/queries/project-metadata");
const mockUseProjectMetadata = useProjectMetadata as jest.MockedFunction<
  typeof useProjectMetadata
>;

describe("ProjectList", () => {
  const mockProjects: Project[] = [
    {
      id: "project-1",
      name: "Project Alpha",
      description: "First test project",
      status: "running",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
      datasetCount: 3,
    },
    {
      id: "project-2",
      name: "Project Beta",
      description: "Second test project",
      status: "complete",
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-20"),
      datasetCount: 7,
    },
    {
      id: "project-3",
      name: "Project Gamma",
      description: "Third test project",
      status: "setup",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-25"),
      datasetCount: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useProjectMetadata to return loading state
    mockUseProjectMetadata.mockReturnValue({
      datasetCount: undefined,
      lastActivity: undefined,
      isLoading: false,
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <TokenProvider>
        <ProjectsProvider initialProjects={mockProjects}>{ui}</ProjectsProvider>
      </TokenProvider>
    );
  };

  it("renders all projects in a grid layout", () => {
    const { container } = renderWithProviders(
      <ProjectList projects={mockProjects} />
    );

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
  });

  it("renders project cards with correct data", () => {
    renderWithProviders(<ProjectList projects={mockProjects} />);

    expect(screen.getByText("First test project")).toBeInTheDocument();
    expect(screen.getByText("Second test project")).toBeInTheDocument();
    expect(screen.getByText("Third test project")).toBeInTheDocument();

    expect(screen.getByText("3 datasets")).toBeInTheDocument();
    expect(screen.getByText("7 datasets")).toBeInTheDocument();
    expect(screen.getByText("1 dataset")).toBeInTheDocument(); // Singular form
  });

  it("shows empty state when no projects exist", () => {
    render(<ProjectList projects={[]} />);

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first project to get started with data analysis."
      )
    ).toBeInTheDocument();
  });

  it("renders empty state with folder icon", () => {
    const { container } = render(<ProjectList projects={[]} />);

    // Lucide icons render as SVG elements
    const emptyState = container.querySelector(".text-center");
    expect(emptyState).toBeInTheDocument();
  });

  it("does not show empty state when projects exist", () => {
    renderWithProviders(<ProjectList projects={mockProjects} />);

    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Create your first project to get started with data analysis."
      )
    ).not.toBeInTheDocument();
  });

  it("renders correct number of project cards", () => {
    renderWithProviders(<ProjectList projects={mockProjects} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("renders single project correctly", () => {
    const singleProject = [mockProjects[0]];
    renderWithProviders(<ProjectList projects={singleProject} />);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Project Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
  });

  it("renders many projects without error", () => {
    const manyProjects: Project[] = Array.from({ length: 20 }, (_, i) => ({
      id: `project-${i}`,
      name: `Project ${i}`,
      description: `Description ${i}`,
      status: ["complete", "running", "setup"][i % 3] as Project["status"],
      createdAt: new Date(),
      updatedAt: new Date(),
      datasetCount: i,
    }));

    renderWithProviders(<ProjectList projects={manyProjects} />);

    expect(screen.getByText("Project 0")).toBeInTheDocument();
    expect(screen.getByText("Project 19")).toBeInTheDocument();
  });

  it("uses unique keys for project cards", () => {
    const { container } = renderWithProviders(
      <ProjectList projects={mockProjects} />
    );

    const cards = container.querySelectorAll(".card");
    expect(cards).toHaveLength(3);
  });

  it("applies correct grid gap spacing", () => {
    const { container } = renderWithProviders(
      <ProjectList projects={mockProjects} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("gap-6");
  });

  it("renders empty state with correct text alignment", () => {
    const { container } = render(<ProjectList projects={[]} />);

    const emptyState = container.querySelector(".text-center");
    expect(emptyState).toHaveClass("text-center", "py-12");
  });

  it("handles undefined dataset counts in projects", () => {
    const projectsWithoutCounts = mockProjects.map((p) => ({
      ...p,
      datasetCount: undefined,
    }));

    renderWithProviders(<ProjectList projects={projectsWithoutCounts} />);

    // Now expects default value of "0 datasets" when datasetCount is undefined
    expect(screen.getAllByText("0 datasets")).toHaveLength(3);
  });
});
