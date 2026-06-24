import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultsSection } from '../results-section';
import { useAccessToken } from '@/components/providers/token-provider';
import { useResults } from '@/lib/queries/results';
import { useDatasets } from '@/lib/queries/datasets';
import {
  createAccessTokenMock,
  createUnauthenticatedMock,
  setupTestEnv,
  cleanupTestEnv,
} from '@/lib/test-mocks';
import { useToast } from '@/components/ui/toast-provider';

jest.mock('@/components/providers/token-provider');
jest.mock('@/lib/queries/results');
jest.mock('@/lib/queries/datasets');
jest.mock('@/components/ui/toast-provider', () => ({
  useToast: jest.fn(),
}));

const mockPushToast = jest.fn();
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseAccessToken = useAccessToken as jest.MockedFunction<
  typeof useAccessToken
>;
const mockUseResults = useResults as jest.MockedFunction<typeof useResults>;
const mockUseDatasets = useDatasets as jest.MockedFunction<typeof useDatasets>;

function makeResultsReturn(
  results: unknown[],
  opts: { hasNextPage?: boolean; totalCount?: number; isLoading?: boolean } = {}
) {
  const {
    hasNextPage = false,
    totalCount = results.length,
    isLoading = false,
  } = opts;
  return {
    data: isLoading
      ? undefined
      : {
          pages: [{ results, totalCount, offset: 0, hasMore: hasNextPage }],
          pageParams: [0],
        },
    isLoading,
    isError: false,
    error: null,
    hasNextPage,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    isFetching: false,
    isPending: isLoading,
    isSuccess: !isLoading,
    status: (isLoading ? 'pending' : 'success') as 'pending' | 'success',
    fetchStatus: 'idle' as const,
  } as unknown as ReturnType<typeof useResults>;
}

describe('ResultsSection', () => {
  beforeEach(() => {
    setupTestEnv();
    mockUseAccessToken.mockReturnValue(createAccessTokenMock());
    mockUseToast.mockReturnValue({
      push: mockPushToast,
      toasts: [],
      dismiss: jest.fn(),
    });
    mockUseDatasets.mockReturnValue({ data: [], isLoading: false } as any);
    mockUseResults.mockReturnValue(makeResultsReturn([]));
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  it('renders loading state', () => {
    mockUseResults.mockReturnValue(makeResultsReturn([], { isLoading: true }));

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no results', () => {
    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('No results available yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Results will appear here once analysis is complete.')
    ).toBeInTheDocument();
  });

  it('renders results list', () => {
    const results = [
      {
        id: '1',
        name: 'Result 1',
        type: 'Analysis Type A',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        name: 'Result 2',
        type: 'Analysis Type B',
        createdAt: new Date('2024-01-02T11:00:00Z'),
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
    expect(screen.queryByText('Analysis Type A')).not.toBeInTheDocument();
    expect(screen.queryByText('Analysis Type B')).not.toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const results = [
      {
        id: '1',
        name: 'Result 1',
        type: 'Analysis',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('shows hover effect on result items', () => {
    const results = [
      {
        id: '1',
        name: 'Result 1',
        type: 'Analysis',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    expect(container.querySelector('.hover\\:bg-gray-50')).toBeInTheDocument();
  });

  it('shows load more button when more pages are available on the server', () => {
    const results = Array.from({ length: 3 }, (_, i) => ({
      id: `${i}`,
      name: `Result ${i}`,
      type: 'Analysis',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    }));

    mockUseResults.mockReturnValue(
      makeResultsReturn(results, { hasNextPage: true, totalCount: 5 })
    );

    render(<ResultsSection projectId="test-project-id" />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Load more (2 remaining)')).toBeInTheDocument();
  });

  it('does not show load more button when all results are loaded', () => {
    const results = Array.from({ length: 3 }, (_, i) => ({
      id: `${i}`,
      name: `Result ${i}`,
      type: 'Analysis',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    }));

    mockUseResults.mockReturnValue(
      makeResultsReturn(results, { hasNextPage: false, totalCount: 3 })
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.queryByText(/Load more/)).not.toBeInTheDocument();
  });

  it('renders download button when results are present', () => {
    const results = [
      {
        id: '1',
        name: 'Result 1',
        type: 'Analysis',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Download Results')).toBeInTheDocument();
    expect(screen.queryByText('Show Raw Data')).not.toBeInTheDocument();
  });

  it('shows success toast when download starts', async () => {
    const results = [{ id: '1', name: 'R1', type: 'T', createdAt: new Date() }];
    mockUseResults.mockReturnValue(makeResultsReturn(results));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(new Blob(['{}'], { type: 'application/json' })),
    });
    window.URL.createObjectURL = jest.fn(() => 'mock-url');
    window.URL.revokeObjectURL = jest.fn();

    render(<ResultsSection projectId="p1" />);

    screen.getByText('Download Results').click();

    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Download Started',
        variant: 'default',
      })
    );
  });

  it('shows error toast when download fails', async () => {
    const results = [{ id: '1', name: 'R1', type: 'T', createdAt: new Date() }];
    mockUseResults.mockReturnValue(makeResultsReturn(results));

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Database failure' }),
    });

    render(<ResultsSection projectId="p1" />);

    screen.getByText('Download Results').click();

    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Server Error',
        description: expect.stringContaining('500'),
        variant: 'destructive',
      })
    );
  });

  it('shows error toast when downloading without access token', async () => {
    const results = [{ id: '1', name: 'R1', type: 'T', createdAt: new Date() }];
    mockUseResults.mockReturnValue(makeResultsReturn(results));
    mockUseAccessToken.mockReturnValue(
      createAccessTokenMock({ accessToken: null, isAuthenticated: true })
    );

    render(<ResultsSection projectId="p1" />);

    screen.getByText('Download Results').click();

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in Required',
        variant: 'destructive',
      })
    );
  });

  it('renders empty state when not authenticated', () => {
    mockUseAccessToken.mockReturnValue(createUnauthenticatedMock());

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('No results available yet.')).toBeInTheDocument();
  });

  it('renders model performance from the new "After" API structure', async () => {
    const results = [
      {
        id: 'r1',
        name: 'Analysis Result',
        result_type: 'ml_analysis',
        created_at: new Date().toISOString(),
        createdAt: new Date(),
        data: {
          all_model_configs: {
            xgboost: {
              best_config: 'config_1',
              best_config_metrics: {
                accuracy: 0.85,
                roc_auc: 0.9,
                params: { depth: 5 },
              },
              test_metrics: { accuracy: 0.88, roc_auc: 0.92 },
              feature_importance: { feature_1: 0.15 },
            },
          },
        },
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    render(<ResultsSection projectId="p1" />);

    screen.getByText('Analysis Result').click();

    expect(screen.getByText('Xgboost')).toBeInTheDocument();
    expect(screen.getByText('0.9000')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renders model performance from flattened metrics structure', async () => {
    const results = [
      {
        id: 'r2',
        name: 'Flattened Result',
        type: 'ml_analysis',
        createdAt: new Date(),
        data: {
          all_model_configs: {
            xgboost: {
              metrics: { roc_auc: 0.75, accuracy: 0.8 },
              params: { depth: 3 },
              feature_importance: { feature_A: 0.2 },
            },
          },
        },
      },
    ];

    mockUseResults.mockReturnValue(makeResultsReturn(results));

    render(<ResultsSection projectId="p1" />);

    screen.getByText('Flattened Result').click();

    expect(screen.getByText('0.7500')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('displays SVG icon in empty state', () => {
    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-12', 'w-12');
  });
});
