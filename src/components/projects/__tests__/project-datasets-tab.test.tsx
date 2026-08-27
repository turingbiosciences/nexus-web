import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectDatasetsTab } from '../project-datasets-tab';
import { useDatasets } from '@/lib/queries/datasets';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { useProjects } from '@/components/providers/projects-provider';

// Mock dependencies
jest.mock('@/lib/queries/datasets');
jest.mock('@/components/providers/auth-state-provider');
jest.mock('@/components/providers/projects-provider');
jest.mock('@/lib/queries/dataset-mutations', () => ({
  useUploadDatasetMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useDeleteDatasetMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useDownloadDatasetMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));
jest.mock('@/components/ui/toast-provider', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockUseDatasets = useDatasets as jest.MockedFunction<typeof useDatasets>;
const mockUseAuthState = useAuthState as jest.MockedFunction<
  typeof useAuthState
>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

describe('ProjectDatasetsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthState.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
    });
    mockUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: null,
      createProject: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      getProjectById: jest.fn(),
      addDataset: jest.fn(),
    });
    mockUseDatasets.mockReturnValue({
      data: [],
      isError: false,
      refetch: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders DatasetsSection', () => {
    renderWithQueryClient(<ProjectDatasetsTab projectId="test-project-123" />);

    expect(mockUseDatasets).toHaveBeenCalledWith(
      'test-project-123',
      expect.any(Object)
    );
  });

  it('passes projectId prop to DatasetsSection', () => {
    renderWithQueryClient(
      <ProjectDatasetsTab projectId="another-project-456" />
    );

    expect(mockUseDatasets).toHaveBeenCalledWith(
      'another-project-456',
      expect.any(Object)
    );
  });
});
