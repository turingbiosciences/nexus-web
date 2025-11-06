import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewProjectDialog } from "../new-project-dialog";

// Mock Logto
jest.mock("@logto/react", () => ({
  useLogto: () => ({
    isAuthenticated: true,
    isLoading: false,
    getAccessToken: jest.fn().mockResolvedValue("test-token"),
  }),
}));

// Mock API
jest.mock("@/lib/api/projects");

// Mock useProjects hook
const mockCreateProject = jest.fn();

jest.mock("@/components/providers/projects-provider", () => ({
  ProjectsProvider: ({ children }: { children: React.ReactNode }) => children,
  useProjects: () => ({
    projects: [],
    loading: false,
    error: null,
    createProject: mockCreateProject,
    updateProject: jest.fn(),
    getProjectById: jest.fn(),
    addDataset: jest.fn(),
    getStatusCounts: jest.fn(() => ({
      complete: 0,
      running: 0,
      setup: 0,
    })),
  }),
}));

describe("NewProjectDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <NewProjectDialog
        open={false}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when open is true", () => {
    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Metabolomics Study")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Brief description of the project goals")
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("submits form with name only", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockResolvedValue({
      id: "new-project-id",
      name: "Test Project",
      description: "",
      status: "setup",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText("e.g. Metabolomics Study");
    await user.type(nameInput, "Test Project");

    const submitButton = screen.getByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: "Test Project",
        description: "",
      });
    });

    expect(mockOnCreated).toHaveBeenCalledWith("new-project-id");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("submits form with name and description", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockResolvedValue({
      id: "new-project-id",
      name: "Test Project",
      description: "Test description",
      status: "setup",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText("e.g. Metabolomics Study");
    const descInput = screen.getByPlaceholderText(
      "Brief description of the project goals"
    );

    await user.type(nameInput, "Test Project");
    await user.type(descInput, "Test description");

    const submitButton = screen.getByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: "Test Project",
        description: "Test description",
      });
    });

    expect(mockOnCreated).toHaveBeenCalledWith("new-project-id");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText("e.g. Metabolomics Study");
    await user.type(nameInput, "Test Project");

    const submitButton = screen.getByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it("displays error message when creation fails", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockRejectedValue(new Error("Network error"));

    render(
      <NewProjectDialog
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText("e.g. Metabolomics Study");
    await user.type(nameInput, "Test Project");

    const submitButton = screen.getByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  it("works without onCreated callback", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockResolvedValue({
      id: "new-project-id",
      name: "Test Project",
      description: "",
      status: "setup",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(<NewProjectDialog open={true} onClose={mockOnClose} />);

    const nameInput = screen.getByPlaceholderText("e.g. Metabolomics Study");
    await user.type(nameInput, "Test Project");

    const submitButton = screen.getByRole("button", {
      name: /create project/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalled();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
