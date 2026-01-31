import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStats } from '../dashboard-stats';
import { getDashboardStats } from '@/lib/api/projects';
import { useAccessToken } from '@/components/providers/token-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
jest.mock('@/lib/api/projects');
jest.mock('@/components/providers/token-provider');

const mockedGetDashboardStats = getDashboardStats as jest.Mock;
const mockedUseAccessToken = useAccessToken as jest.Mock;

describe('useDashboardStats hook', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('fetches dashboard stats when authenticated', async () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'test-token',
    });

    const mockStats = {
      total_projects: 10,
      total_ml_runs: 25,
      algorithm_wins: { xgboost: 5 },
      total_runtime_seconds: 12000,
    };

    mockedGetDashboardStats.mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStats);
    expect(mockedGetDashboardStats).toHaveBeenCalledWith('test-token');
  });

  it('does not fetch when not authenticated', async () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: false,
      accessToken: null,
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockedGetDashboardStats).not.toHaveBeenCalled();
  });

  it('handles error state', async () => {
    mockedUseAccessToken.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'test-token',
    });

    const error = new Error('Failed to fetch');
    mockedGetDashboardStats.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
