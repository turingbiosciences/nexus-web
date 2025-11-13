import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectSettingsTab } from "@/components/projects/project-settings-tab";
import { Project } from "@/types/project";

// Mock dependencies
jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: jest.fn(),
}));

jest.mock("@/lib/auth-fetch", () => ({
  authFetch: jest.fn(),
}));

jest.mock("@/components/ui/toast-provider", () => ({
  useToast: jest.fn(),
}));

import { useAccessToken } from "@/components/providers/token-provider";
import { authFetch } from "@/lib/auth-fetch";
import { useToast } from "@/components/ui/toast-provider";

const mockedUseAccessToken = useAccessToken as jest.Mock;
const mockedAuthFetch = authFetch as jest.Mock;
const mockedUseToast = useToast as jest.Mock;

describe("ProjectSettingsTab", () => {
  const mockProject: Project = {
    id: "project-1",
    name: "Test Project",
    description: "Test Description",
    status: "setup",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    datasetCount: 3,
  };

  const mockOnUpdateProject = jest.fn();
  const mockOnDeleteProject = jest.fn();
  const mockRefreshToken = jest.fn();
  const mockPushToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAccessToken.mockReturnValue({
      accessToken: "mock-token",
      refreshToken: mockRefreshToken,
      isAuthenticated: true,
      authLoading: false,
    });

    mockedUseToast.mockReturnValue({
      push: mockPushToast,
    });

    // Default success response
    mockedAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "project-1",
        name: "Updated Project",
        description: "Updated Description",
      }),
    });
  });

  it("renders project settings with name and description", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    expect(screen.getByDisplayValue("Test Project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });

  it("disables save button when no changes are made", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when name is changed", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "New Project Name" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("enables save button when description is changed", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    const descriptionInput = screen.getByDisplayValue("Test Description");
    fireEvent.change(descriptionInput, {
      target: { value: "New Description" },
    });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("sends PUT request with updated data when save is clicked", async () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Change description
    const descriptionInput = screen.getByDisplayValue("Test Description");
    fireEvent.change(descriptionInput, { target: { value: "Updated Desc" } });

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining("/projects/project-1"),
        expect.objectContaining({
          method: "PUT",
          token: "mock-token",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Name",
            description: "Updated Desc",
          }),
        })
      );
    });
  });

  it("calls onUpdateProject with response data on successful save", async () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalledWith("project-1", {
        name: "Updated Project",
        description: "Updated Description",
      });
    });
  });

  it("shows success toast on successful save", async () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith({
        title: "Project Updated",
        description: "Your changes have been saved successfully.",
        variant: "default",
      });
    });
  });

  it("shows error toast on failed save", async () => {
    mockedAuthFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Save failed" }),
    });

    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Update Failed",
          variant: "destructive",
        })
      );
    });
  });

  it("shows 'Saving...' text while saving", async () => {
    // Make authFetch take some time
    mockedAuthFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
        )
    );

    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Test Project");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    // Check for saving text
    expect(await screen.findByText("Saving...")).toBeInTheDocument();
  });

  it("renders delete project button", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /delete this project/i })
    ).toBeInTheDocument();
  });

  it("shows confirmation dialog when delete is clicked", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: /delete this project/i,
    });
    fireEvent.click(deleteButton);

    expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockProject.name))).toBeInTheDocument();
  });

  it("calls onDeleteProject when confirmed", async () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole("button", {
      name: /delete this project/i,
    });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole("button", {
      name: /yes, delete project/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnDeleteProject).toHaveBeenCalled();
    });
  });

  it("can cancel deletion", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole("button", {
      name: /delete this project/i,
    });
    fireEvent.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Confirmation should be hidden
    expect(
      screen.queryByText(/are you absolutely sure/i)
    ).not.toBeInTheDocument();
    expect(mockOnDeleteProject).not.toHaveBeenCalled();
  });

  it("disables buttons while deleting", () => {
    render(
      <ProjectSettingsTab
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={true}
      />
    );

    // Click delete button to show confirmation
    const deleteButton = screen.getByRole("button", {
      name: /delete this project/i,
    });
    fireEvent.click(deleteButton);

    // Both cancel and confirm should be disabled
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const confirmButton = screen.getByRole("button", { name: /deleting.../i });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it("handles empty description correctly", () => {
    const projectWithoutDesc = {
      ...mockProject,
      description: "",
    };

    render(
      <ProjectSettingsTab
        project={projectWithoutDesc}
        onUpdateProject={mockOnUpdateProject}
        onDeleteProject={mockOnDeleteProject}
        isDeleting={false}
      />
    );

    // Should render without crashing with empty description
    expect(screen.getByDisplayValue("Test Project")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });
});
