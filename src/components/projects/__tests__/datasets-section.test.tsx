import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatasetsSection } from "../datasets-section";

// Mock dependencies
const mockGetProjectById = jest.fn();
const mockAddDataset = jest.fn();
const mockUpdateProject = jest.fn();
const mockPush = jest.fn();
const mockUploadMutate = jest.fn();
const mockDeleteMutate = jest.fn();
const mockUseDatasetsReturn = jest.fn();

jest.mock("@/components/providers/projects-provider", () => ({
  useProjects: () => ({
    getProjectById: mockGetProjectById,
    addDataset: mockAddDataset,
    updateProject: mockUpdateProject,
  }),
}));

jest.mock("@/lib/queries/datasets", () => ({
  useDatasets: (...args: unknown[]) => mockUseDatasetsReturn(...args),
}));

jest.mock("@/lib/queries/dataset-mutations", () => ({
  useUploadDatasetMutation: () => ({
    mutate: mockUploadMutate,
    isPending: false,
  }),
  useDeleteDatasetMutation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

jest.mock("@/components/ui/toast-provider", () => ({
  useToast: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/components/file-upload/file-uploader", () => ({
  FileUploader: ({
    onUploadComplete,
  }: {
    onUploadComplete: (files: File[]) => void;
  }) => (
    <div data-testid="file-uploader">
      <button
        onClick={() => {
          const mockFile = new File(["test"], "test.csv", {
            type: "text/csv",
          });
          onUploadComplete([mockFile]);
        }}
      >
        Upload File
      </button>
    </div>
  ),
}));

jest.mock("@/lib/reconcile-datasets", () => ({
  reconcileDatasets: jest.fn(({ remote, optimistic, pendingDeleteIds }) => {
    const remoteSafe = remote || [];
    const optimisticSafe = optimistic || [];
    return [...remoteSafe, ...optimisticSafe].filter(
      (d) => !pendingDeleteIds.includes(d.id)
    );
  }),
}));

describe("DatasetsSection", () => {
  const mockProject = {
    id: "project-1",
    name: "Test Project",
    description: "Test description",
    status: "running" as const,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    datasetCount: 2,
    datasets: [
      {
        id: "dataset-1",
        filename: "test1.csv",
        size: 1024,
        uploadedAt: new Date("2024-01-10"),
      },
      {
        id: "dataset-2",
        filename: "test2.csv",
        size: 2048,
        uploadedAt: new Date("2024-01-12"),
      },
    ],
  };

  const mockDatasetsQuery = {
    data: [
      {
        id: "dataset-1",
        filename: "test1.csv",
        size: 1024,
        uploadedAt: new Date("2024-01-10"),
      },
      {
        id: "dataset-2",
        filename: "test2.csv",
        size: 2048,
        uploadedAt: new Date("2024-01-12"),
      },
    ],
    isLoading: false,
    nextCursor: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjectById.mockReturnValue(mockProject);
    mockUseDatasetsReturn.mockReturnValue(mockDatasetsQuery);
  });

  it("renders datasets section with title", () => {
    render(<DatasetsSection projectId="project-1" />);

    expect(screen.getByText("Datasets")).toBeInTheDocument();
  });

  it("displays dataset count message", () => {
    render(<DatasetsSection projectId="project-1" />);

    expect(
      screen.getByText("This project has 2 dataset(s).")
    ).toBeInTheDocument();
  });

  it("displays no datasets message when count is zero", () => {
    mockGetProjectById.mockReturnValue({
      ...mockProject,
      datasetCount: 0,
      datasets: [],
    });

    mockUseDatasetsReturn.mockReturnValue({
      ...mockDatasetsQuery,
      data: [],
    });

    render(<DatasetsSection projectId="project-1" />);

    expect(screen.getByText("No datasets found.")).toBeInTheDocument();
  });

  it("renders list of datasets with details", () => {
    render(<DatasetsSection projectId="project-1" />);

    expect(screen.getByText("test1.csv")).toBeInTheDocument();
    expect(screen.getByText("test2.csv")).toBeInTheDocument();
    expect(screen.getByText(/1 KB/)).toBeInTheDocument();
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
  });

  it("shows loading skeleton when data is loading", () => {
    mockUseDatasetsReturn.mockReturnValue({
      ...mockDatasetsQuery,
      isLoading: true,
    });

    const { container } = render(<DatasetsSection projectId="project-1" />);

    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders download button for each dataset", () => {
    render(<DatasetsSection projectId="project-1" />);

    const downloadButtons = screen.getAllByRole("button", {
      name: /download/i,
    });
    expect(downloadButtons).toHaveLength(2);
  });

  it("renders delete button for each dataset", () => {
    render(<DatasetsSection projectId="project-1" />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("logs to console when download button is clicked", async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    render(<DatasetsSection projectId="project-1" />);

    const downloadButtons = screen.getAllByRole("button", {
      name: /download/i,
    });
    await user.click(downloadButtons[0]);

    expect(consoleSpy).toHaveBeenCalledWith("Download dataset", "dataset-2");

    consoleSpy.mockRestore();
  });

  it("handles delete dataset with optimistic update", async () => {
    const user = userEvent.setup();
    render(<DatasetsSection projectId="project-1" />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockUpdateProject).toHaveBeenCalledWith("project-1", {
      datasets: [mockProject.datasets![0]], // Removed second dataset (dataset-2 is now first after sort)
      datasetCount: 1,
      lastActivity: "dataset deleted",
    });

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      "dataset-2",
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      })
    );
  });

  it("shows success toast on delete success", async () => {
    const user = userEvent.setup();
    mockDeleteMutate.mockImplementation((id, options) => {
      options.onSuccess?.();
    });

    render(<DatasetsSection projectId="project-1" />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockPush).toHaveBeenCalledWith({
      title: "Dataset deleted",
      description: "test2.csv was removed successfully.",
      variant: "default",
    });
  });

  it("shows error toast on delete failure", async () => {
    const user = userEvent.setup();
    mockDeleteMutate.mockImplementation((id, options) => {
      options.onError?.();
    });

    render(<DatasetsSection projectId="project-1" />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockPush).toHaveBeenCalledWith({
      title: "Deletion failed",
      description: "Could not delete test2.csv. Please retry.",
      variant: "destructive",
    });
  });

  it("renders file uploader when showUploader is true", () => {
    render(<DatasetsSection projectId="project-1" showUploader={true} />);

    expect(screen.getByTestId("file-uploader")).toBeInTheDocument();
  });

  it("does not render file uploader when showUploader is false", () => {
    render(<DatasetsSection projectId="project-1" showUploader={false} />);

    expect(screen.queryByTestId("file-uploader")).not.toBeInTheDocument();
  });

  it("handles file upload completion", async () => {
    const user = userEvent.setup();
    mockUploadMutate.mockImplementation((file, options) => {
      options.onSuccess?.();
    });

    render(<DatasetsSection projectId="project-1" />);

    const uploadButton = screen.getByRole("button", { name: /upload file/i });
    await user.click(uploadButton);

    expect(mockAddDataset).toHaveBeenCalledWith("project-1", {
      name: "test.csv",
      size: 4,
    });

    expect(mockUploadMutate).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it("shows success toast on upload success", async () => {
    const user = userEvent.setup();
    mockUploadMutate.mockImplementation((file, options) => {
      options.onSuccess?.();
    });

    render(<DatasetsSection projectId="project-1" />);

    const uploadButton = screen.getByRole("button", { name: /upload file/i });
    await user.click(uploadButton);

    expect(mockPush).toHaveBeenCalledWith({
      title: "Upload complete",
      description: "test.csv was uploaded successfully.",
      variant: "default",
    });
  });

  it("shows error toast on upload failure", async () => {
    const user = userEvent.setup();
    mockUploadMutate.mockImplementation((file, options) => {
      options.onError?.();
    });

    render(<DatasetsSection projectId="project-1" />);

    const uploadButton = screen.getByRole("button", { name: /upload file/i });
    await user.click(uploadButton);

    expect(mockPush).toHaveBeenCalledWith({
      title: "Upload failed",
      description: "Could not upload test.csv. Please try again.",
      variant: "destructive",
    });
  });

  it("renders nothing when project is not found", () => {
    mockGetProjectById.mockReturnValue(null);

    const { container } = render(<DatasetsSection projectId="nonexistent" />);

    expect(container.firstChild).toBeNull();
  });

  it("renders optimistic datasets with reduced opacity", () => {
    mockGetProjectById.mockReturnValue({
      ...mockProject,
      datasets: [
        ...mockProject.datasets!,
        {
          id: "optimistic-123",
          filename: "uploading.csv",
          size: 512,
          uploadedAt: new Date(),
        },
      ],
    });

    render(<DatasetsSection projectId="project-1" />);

    const optimisticItem = screen.getByText("uploading.csv").closest("li");
    expect(optimisticItem).toHaveClass("opacity-70", "italic");
  });
});
