import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAccessToken } from '@/components/providers/token-provider';
import { getDashboardStats } from '@/lib/api/projects';
import { DashboardStats } from '@/types/project';

export function useDashboardStats(
  options?: Omit<UseQueryOptions<DashboardStats, Error>, 'queryKey' | 'queryFn'>
) {
  const { accessToken, isAuthenticated } = useAccessToken();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      return getDashboardStats(accessToken);
    },
    enabled: isAuthenticated && !!accessToken && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    ...options,
    // Safely cast to ensure compatibility if TData/TQueryFnData mismatch slightly
  } as UseQueryOptions<DashboardStats, Error>);
}
