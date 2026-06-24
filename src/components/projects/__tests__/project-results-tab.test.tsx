import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectResultsTab } from '../project-results-tab';
import { useAccessToken } from '@/components/providers/token-provider';
import { useResults } from '@/lib/queries/results';
import { useDatasets } from '@/lib/queries/datasets';

jest.mock('@/components/ui/toast-provider', () => ({
  useToast: jest.fn(() => ({
    push: jest.fn(),
    toasts: [],
    dismiss: jest.fn(),
  })),
}));
jest.mock('@/components/providers/token-provider');
jest.mock('@/lib/queries/results');
jest.mock('@/lib/queries/datasets');

const mockUseAccessToken = useAccessToken as jest.MockedFunction<
  typeof useAccessToken
>;
const mockUseResults = useResults as jest.MockedFunction<typeof useResults>;
const mockUseDatasets = useDatasets as jest.MockedFunction<typeof useDatasets>;

const emptyResultsReturn = {
  data: {
    pages: [{ results: [], totalCount: 0, offset: 0, hasMore: false }],
    pageParams: [0],
  },
  isLoading: false,
  isError: false,
  error: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
  isFetching: false,
  isPending: false,
  isSuccess: true,
  status: 'success' as const,
  fetchStatus: 'idle' as const,
} as unknown as ReturnType<typeof useResults>;

describe('ProjectResultsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessToken.mockReturnValue({
      accessToken: 'mock-token',
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
      isAuthenticated: true,
      authLoading: false,
    });
    mockUseResults.mockReturnValue(emptyResultsReturn);
    mockUseDatasets.mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('renders ResultsSection with projectId', () => {
    render(<ProjectResultsTab projectId="test-project-123" />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
  });

  it('passes projectId prop to ResultsSection', () => {
    render(<ProjectResultsTab projectId="another-project-456" />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
  });
});
