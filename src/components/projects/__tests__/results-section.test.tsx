import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultsSection } from '../results-section';
import { useAccessToken } from '@/components/providers/token-provider';
import { useQuery } from '@tanstack/react-query';
import {
  createAccessTokenMock,
  createUnauthenticatedMock,
  createSuccessQueryReturn,
  createLoadingQueryReturn,
  setupTestEnv,
  cleanupTestEnv,
} from '@/lib/test-mocks';

// Mock dependencies
jest.mock('@/components/providers/token-provider');
jest.mock('@tanstack/react-query');
jest.mock('@/components/ui/toast-provider', () => ({
  useToast: jest.fn(),
}));

import { useToast } from '@/components/ui/toast-provider';

const mockPushToast = jest.fn();
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockUseAccessToken = useAccessToken as jest.MockedFunction<
  typeof useAccessToken
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('ResultsSection', () => {
  beforeEach(() => {
    setupTestEnv();
    mockUseAccessToken.mockReturnValue(createAccessTokenMock());
    mockUseToast.mockReturnValue({
      push: mockPushToast,
      toasts: [],
      dismiss: jest.fn(),
    });
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  it('renders loading state', () => {
    mockUseQuery.mockReturnValue(
      createLoadingQueryReturn() as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no results', () => {
    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

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

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(results) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Analysis Type A')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
    expect(screen.getByText('Analysis Type B')).toBeInTheDocument();
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

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(results) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    // Date should be formatted using toLocaleDateString
    const dateElement = screen.getByText(/1\/15\/2024/);
    expect(dateElement).toBeInTheDocument();
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

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(results) as ReturnType<typeof useQuery>
    );

    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    const resultItem = container.querySelector('.hover\\:bg-gray-50');
    expect(resultItem).toBeInTheDocument();
  });

  it('disables query when not authenticated', () => {
    mockUseAccessToken.mockReturnValue(createUnauthenticatedMock());

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('disables query when no access token', () => {
    mockUseAccessToken.mockReturnValue(
      createAccessTokenMock({
        accessToken: null,
        isAuthenticated: true,
      })
    );

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('uses correct query key', () => {
    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="my-project-123" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['results', 'my-project-123', {}],
      })
    );
  });

  it('sets staleTime to 30 seconds', () => {
    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 30_000,
      })
    );
  });

  it('displays SVG icon in empty state', () => {
    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn([]) as ReturnType<typeof useQuery>
    );

    const { container } = render(
      <ResultsSection projectId="test-project-id" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-12', 'w-12');
  });

  it('renders multiple results correctly', () => {
    const results = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      name: `Result ${i}`,
      type: 'Analysis',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    }));

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(results) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(5);
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

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(results) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="test-project-id" />);

    expect(screen.getByText('Download Results')).toBeInTheDocument();
    expect(screen.queryByText('Show Raw Data')).not.toBeInTheDocument();
  });

  it('shows success toast when download starts', async () => {
    const results = [{ id: '1', name: 'R1', type: 'T', createdAt: new Date() }];
    mockUseQuery.mockReturnValue(createSuccessQueryReturn(results) as any);

    // Mock successful fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(new Blob(['{}'], { type: 'application/json' })),
    });

    // Mock URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = jest.fn(() => 'mock-url');
    window.URL.revokeObjectURL = jest.fn();

    render(<ResultsSection projectId="p1" />);

    const downloadBtn = screen.getByText('Download Results');
    downloadBtn.click();

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
    mockUseQuery.mockReturnValue(createSuccessQueryReturn(results) as any);

    // Mock failed fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Database failure' }),
    });

    render(<ResultsSection projectId="p1" />);

    const downloadBtn = screen.getByText('Download Results');
    downloadBtn.click();

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
    mockUseQuery.mockReturnValue(createSuccessQueryReturn(results) as any);
    mockUseAccessToken.mockReturnValue(
      createAccessTokenMock({
        accessToken: null,
        isAuthenticated: true,
      })
    );

    render(<ResultsSection projectId="p1" />);

    const downloadBtn = screen.getByText('Download Results');
    downloadBtn.click();

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in Required',
        variant: 'destructive',
      })
    );
  });

  it('renders model performance from the new "After" API structure', async () => {
    const results = [
      {
        id: 'r1',
        name: 'Analysis Result',
        result_type: 'ml_analysis',
        created_at: new Date().toISOString(),
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

    // transformResults in results.ts will handle translating this to the UI expected format
    const transformed = results.map((r) => ({
      id: r.id,
      name: r.name || 'Analysis Result',
      type: r.result_type || 'Unknown',
      createdAt: new Date(r.created_at),
      ...(r as any),
    }));

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(transformed) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="p1" />);

    // Expand the result to show charts/tables
    const resultHeader = screen.getByText('Analysis Result');
    resultHeader.click();

    // Verify model name is rendered (formatted)
    expect(screen.getByText('Xgboost')).toBeInTheDocument();

    // Verify AUROC is rendered (from best_config_metrics)
    expect(screen.getByText('0.9000')).toBeInTheDocument();

    // Verify Details button is present (implies parameters were found)
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('handles missing best_config by deriving it from metrics if possible', async () => {
    const results = [
      {
        id: 'r1',
        name: 'Analysis Result',
        result_type: 'ml_analysis',
        created_at: new Date().toISOString(),
        data: {
          all_model_configs: {
            xgboost: {
              // best_config is missing
              best_config_metrics: {
                accuracy: 0.85,
                roc_auc: 0.9,
                params: { depth: 5 },
              },
              configs: {
                config_1: {
                  accuracy: 0.85,
                  roc_auc: 0.9,
                  params: { depth: 5 },
                },
              },
              test_metrics: { accuracy: 0.88, roc_auc: 0.92 },
              feature_importance: { feature_1: 0.15 },
            },
          },
        },
      },
    ];

    // transformResults in results.ts will handle translating this to the UI expected format
    const transformed = results.map((r) => ({
      id: r.id,
      name: r.name || 'Analysis Result',
      type: r.result_type || 'Unknown',
      createdAt: new Date(r.created_at),
      ...(r as any),
    }));

    mockUseQuery.mockReturnValue(
      createSuccessQueryReturn(transformed) as ReturnType<typeof useQuery>
    );

    render(<ResultsSection projectId="p1" />);

    // Expand the result to show charts/tables
    const resultHeader = screen.getByText('Analysis Result');
    resultHeader.click();

    // Verify model name is rendered (formatted)
    expect(screen.getByText('Xgboost')).toBeInTheDocument();

    // Verify AUROC is rendered (from best_config_metrics)
    expect(screen.getByText('0.9000')).toBeInTheDocument();

    // Verify that we can find the config name "config_1" even if best_config is missing
    expect(screen.getByText('config_1')).toBeInTheDocument();
  });
});
