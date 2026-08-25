import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { getDashboardStats } from '@/lib/api/projects';
import { DashboardStats } from '@/types/project';

export function useDashboardStats(
  options?: Omit<UseQueryOptions<DashboardStats, Error>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    enabled: isAuthenticated && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    ...options,
    // Safely cast to ensure compatibility if TData/TQueryFnData mismatch slightly
  } as UseQueryOptions<DashboardStats, Error>);
}
