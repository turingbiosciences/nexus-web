import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  ProjectsProvider,
  useProjects,
} from "@/components/providers/projects-provider";

// Mock TokenProvider - initially return default mock
const mockUseAccessToken = jest.fn(() => ({
  accessToken: "test-token",
  isLoading: false,
  error: null,
  refreshToken: jest.fn(),
}));

jest.mock("../token-provider", () => ({
  useAccessToken: () => mockUseAccessToken(),
}));

// Mock API
jest.mock("@/lib/api/projects", () => ({
  fetchProjects: jest.fn().mockResolvedValue([
    {
      id: "p1",
      name: "Project 1",
      description: "Desc",
      status: "setup",
      datasets: [],
      datasetCount: 0,
      lastActivity: "just now",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  createProject: jest.fn().mockResolvedValue({
    id: "new",
    name: "New",
    description: "New Desc",
    status: "setup",
    datasets: [],
    datasetCount: 0,
    lastActivity: "just now",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
}));

function Consumer() {
  const { projects, createProject, addDataset, updateProject } = useProjects();
  return (
    <div>
      <ul data-testid="project-list">
        {projects.map((p) => (
          <li key={p.id} data-testid={`project-${p.id}`}>
            {p.name}:{p.status}:{p.datasetCount}
          </li>
        ))}
      </ul>
      <button
        onClick={async () => {
          await createProject({ name: "Created", description: "C" });
        }}
      >
        create
      </button>
      <button
        onClick={() => {
          if (projects[0]) {
            addDataset(projects[0].id, { name: "file.txt", size: 123 });
          }
        }}
      >
        add-dataset
      </button>
      <button
        onClick={() => {
          if (projects[0]) {
            updateProject(projects[0].id, { status: "running" });
          }
        }}
      >
        update-status
      </button>
      <div data-testid="first-project-status">
        {projects[0]?.status ?? "none"}
      </div>
    </div>
  );
}

describe("ProjectsProvider", () => {
  it("loads initial projects", async () => {
    render(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );
    expect(await screen.findByTestId("project-p1")).toBeInTheDocument();
  });

  it("creates a project and appears in list", async () => {
    render(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );
    await screen.findByTestId("project-p1");
    screen.getByText(/create/i).click();
    await waitFor(() => {
      // New project should be added (id 'new')
      expect(screen.getByTestId("project-new")).toBeInTheDocument();
    });
  });

  it("adds dataset and increments datasetCount", async () => {
    render(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );
    const item = await screen.findByTestId("project-p1");
    const before = item.textContent;
    screen.getByText(/add-dataset/i).click();
    await waitFor(() => {
      const after = screen.getByTestId("project-p1").textContent;
      expect(after).not.toEqual(before);
      expect(after).toMatch(/:setup:1$/); // datasetCount 1
    });
  });

  it("updates status and reflects change", async () => {
    render(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );
    await screen.findByTestId("project-p1");
    expect(screen.getByTestId("first-project-status")).toHaveTextContent(
      /setup/
    );
    screen.getByText(/update-status/i).click();
    await waitFor(() => {
      expect(screen.getByTestId("first-project-status")).toHaveTextContent(
        /running/
      );
    });
  });

  it("refetches projects when accessToken changes (new user session)", async () => {
    const { fetchProjects } = await import("@/lib/api/projects");
    const mockFetchProjects = fetchProjects as jest.Mock;

    // User A signs in with token-a
    mockUseAccessToken.mockReturnValue({
      accessToken: "token-a",
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
    });
    mockFetchProjects.mockResolvedValue([
      {
        id: "user-a-project",
        name: "User A Project",
        description: "A's project",
        status: "setup",
        datasets: [],
        datasetCount: 0,
        lastActivity: "just now",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const { rerender } = render(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );

    // User A's project should appear
    await waitFor(() => {
      expect(screen.getByTestId("project-user-a-project")).toBeInTheDocument();
    });

    // User A signs out, User B signs in with token-b
    mockUseAccessToken.mockReturnValue({
      accessToken: "token-b",
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
    });
    mockFetchProjects.mockResolvedValue([
      {
        id: "user-b-project",
        name: "User B Project",
        description: "B's project",
        status: "running",
        datasets: [],
        datasetCount: 0,
        lastActivity: "just now",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Force re-render to trigger the accessToken change effect
    rerender(
      <ProjectsProvider>
        <Consumer />
      </ProjectsProvider>
    );

    // User B's project should appear, User A's should be gone
    await waitFor(() => {
      expect(screen.getByTestId("project-user-b-project")).toBeInTheDocument();
      expect(
        screen.queryByTestId("project-user-a-project")
      ).not.toBeInTheDocument();
    });
  });
});
