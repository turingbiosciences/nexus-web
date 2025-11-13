import React from "react";
import { render, screen } from "@testing-library/react";
import { HomePageClient } from "@/components/home-page-client";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock the components and providers
jest.mock("@/components/auth/auth-button", () => ({
  AuthButton: () => <button>Auth Button</button>,
}));

jest.mock("@/components/file-upload/file-uploader", () => ({
  FileUploader: () => <div>File Uploader</div>,
}));

jest.mock("@/components/projects/project-list", () => ({
  ProjectList: () => <div>Project List</div>,
}));

jest.mock("@/components/projects/new-project-dialog", () => ({
  NewProjectDialog: () => <div>New Project Dialog</div>,
}));

jest.mock("@/components/upload/upload-statistics", () => ({
  UploadStatistics: () => <div>Upload Statistics</div>,
}));

jest.mock("@/components/debug/debug-panel", () => ({
  DebugPanel: () => <div>Debug Panel</div>,
}));

jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: jest.fn(),
}));

jest.mock("@/components/providers/projects-provider", () => ({
  useProjects: jest.fn(),
}));

import { useAccessToken } from "@/components/providers/token-provider";
import { useProjects } from "@/components/providers/projects-provider";

const mockedUseAccessToken = useAccessToken as jest.Mock;
const mockedUseProjects = useProjects as jest.Mock;

describe("HomePageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });

    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: null,
      createProject: jest.fn(),
      updateProject: jest.fn(),
      getProjectById: jest.fn(),
      getStatusCounts: jest.fn(() => ({
        setup: 0,
        "data-upload": 0,
        processing: 0,
        completed: 0,
        archived: 0,
      })),
      addDataset: jest.fn(),
    });
  });

  it("renders the main page structure", () => {
    render(<HomePageClient />);

    expect(screen.getByAltText("Turing Biosciences")).toBeInTheDocument();
    expect(screen.getByText("Auth Button")).toBeInTheDocument();
  });

  it("shows sign-in prompt when not authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("Sign in Required")).toBeInTheDocument();
  });

  it("shows projects dashboard when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(
      screen.getByRole("heading", { name: "Projects" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage and monitor your biosciences research projects")
    ).toBeInTheDocument();
  });

  it("renders project list when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("Project List")).toBeInTheDocument();
  });

  it("renders project status chart when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("Project Status Overview")).toBeInTheDocument();
  });

  it("renders new project button when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("New Project")).toBeInTheDocument();
  });

  it("renders new project dialog when authenticated", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("New Project Dialog")).toBeInTheDocument();
  });

  it("renders debug panel", () => {
    render(<HomePageClient />);

    expect(screen.getByText("Debug Panel")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      authLoading: true,
      accessToken: null,
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    // Should show loading card
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows projects error when projects fail to load", () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: "mock-token",
      refreshToken: jest.fn(),
    });

    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: new Error("Failed to load projects"),
      createProject: jest.fn(),
      updateProject: jest.fn(),
      getProjectById: jest.fn(),
      getStatusCounts: jest.fn(() => ({
        setup: 0,
        "data-upload": 0,
        processing: 0,
        completed: 0,
        archived: 0,
      })),
      addDataset: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText("Failed to Load Projects")).toBeInTheDocument();
  });
});
