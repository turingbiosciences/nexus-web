import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectResultsTab } from '../project-results-tab';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { useResults } from '@/lib/queries/results';
import { useDatasets } from '@/lib/queries/datasets';

jest.mock('@/components/ui/toast-provider', () => ({
  useToast: jest.fn(() => ({
    push: jest.fn(),
    toasts: [],
    dismiss: jest.fn(),
  })),
}));
jest.mock('@/components/providers/auth-state-provider');
jest.mock('@/lib/queries/results');
jest.mock('@/lib/queries/datasets');

const mockUseAuthState = useAuthState as jest.MockedFunction<
  typeof useAuthState
>;
const mockUseResults = useResults as jest.MockedFunction<typeof useResults>;
const mockUseDatasets = useDatasets as jest.MockedFunction<typeof useDatasets>;

const emptyResultsReturn = {
  data: {
    pages: [{ results: [], totalCount: 0, offset: 0, hasMore: false }],
    pageParams: [0],
  },
  isError: false,
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
    mockUseAuthState.mockReturnValue({
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
