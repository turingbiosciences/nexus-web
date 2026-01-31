import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomePageClient } from '@/components/home-page-client';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock the components and providers
jest.mock('@/components/auth/auth-button', () => ({
  AuthButton: () => <button>Auth Button</button>,
}));

jest.mock('@/components/file-upload/file-uploader', () => ({
  FileUploader: () => <div>File Uploader</div>,
}));

jest.mock('@/components/projects/new-project-dialog', () => ({
  NewProjectDialog: () => <div>New Project Dialog</div>,
}));

jest.mock('@/components/upload/upload-statistics', () => ({
  UploadStatistics: () => <div>Upload Statistics</div>,
}));

jest.mock('@/components/debug/debug-panel', () => ({
  DebugPanel: () => <div>Debug Panel</div>,
}));

jest.mock('@/components/providers/token-provider', () => ({
  useAccessToken: jest.fn(),
}));

jest.mock('@/components/providers/projects-provider', () => ({
  useProjects: jest.fn(),
}));

import { useAccessToken } from '@/components/providers/token-provider';
import { useProjects } from '@/components/providers/projects-provider';

const mockedUseAccessToken = useAccessToken as jest.Mock;
const mockedUseProjects = useProjects as jest.Mock;

describe('HomePageClient', () => {
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
      addDataset: jest.fn(),
    });
  });

  it('renders the main page structure', () => {
    render(<HomePageClient />);

    expect(screen.getByAltText('Turing Biosciences')).toBeInTheDocument();
    expect(screen.getByText('Auth Button')).toBeInTheDocument();
  });

  it('shows sign-in prompt when not authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
      accessToken: null,
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText('Sign in Required')).toBeInTheDocument();
  });

  it('shows projects dashboard when authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    // New layout has "Projects" heading with project count
    expect(screen.getByText('Projects')).toBeInTheDocument();
    // Check for the stat blocks
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('Total ML Runs')).toBeInTheDocument();
  });

  it('renders project list section when authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    // Check for inline project section - shows empty state when no projects
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('renders stat blocks when authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('Total ML Runs')).toBeInTheDocument();
    expect(screen.getByText('Algorithm Wins')).toBeInTheDocument();
    expect(screen.getByText('Total Runtime')).toBeInTheDocument();
  });

  it('renders recent ML runs section when authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText('Recent ML Runs')).toBeInTheDocument();
  });

  it('renders new project dialog when authenticated', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText('New Project Dialog')).toBeInTheDocument();
  });

  it('renders debug panel', () => {
    render(<HomePageClient />);

    expect(screen.getByText('Debug Panel')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      authLoading: true,
      accessToken: null,
      refreshToken: jest.fn(),
    });

    render(<HomePageClient />);

    // Should show loading card
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows projects error when projects fail to load', () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
      accessToken: 'mock-token',
      refreshToken: jest.fn(),
    });

    mockedUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: new Error('Failed to load projects'),
      createProject: jest.fn(),
      updateProject: jest.fn(),
      getProjectById: jest.fn(),
      addDataset: jest.fn(),
    });

    render(<HomePageClient />);

    expect(screen.getByText('Failed to Load Projects')).toBeInTheDocument();
  });
});
