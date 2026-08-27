/**
 * Infinite-scroll query hook for paginated project results.
 *
 * The backend now returns results in pages ordered newest-first.
 * Each "Load more" click fetches the next page from the server rather
 * than revealing already-loaded data, keeping individual responses small
 * and avoiding 504 timeouts on large projects.
 */

import {
  useInfiniteQuery,
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { authFetch } from '@/lib/auth-fetch';
import { getApiBaseUrl } from '@/lib/api/get-api-base';
import { ProjectResult } from '@/types/project';

const PAGE_SIZE = 3;

interface ApiResultItem {
  id: string;
  name?: string;
  result_type?: string;
  created_at: string;
  [key: string]: unknown;
}

interface ApiResultsPage {
  project_id: string;
  results: ApiResultItem[];
  total_count: number;
}

export interface ResultsPage {
  results: ProjectResult[];
  totalCount: number;
  offset: number;
  hasMore: boolean;
}

export type ResultsQueryResult = UseInfiniteQueryResult<
  InfiniteData<ResultsPage>,
  Error
>;

interface UseResultsOptions {
  enabled?: boolean;
}

export function useResults(
  projectId: string,
  options?: UseResultsOptions
): ResultsQueryResult {
  const { isAuthenticated } = useAuthState();
  const enabled = (options?.enabled ?? true) && !!projectId && isAuthenticated;

  return useInfiniteQuery<
    ResultsPage,
    Error,
    InfiniteData<ResultsPage>,
    [string, string],
    number
  >({
    queryKey: ['results', projectId],
    queryFn: async ({ pageParam }) => {
      const base = getApiBaseUrl();
      const url = `${base}/projects/${projectId}/results?limit=${PAGE_SIZE}&offset=${pageParam}`;
      const res = await authFetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`API request failed (${res.status})`);
      const data: ApiResultsPage = await res.json();

      const rawResults = Array.isArray(data.results) ? data.results : [];
      const results: ProjectResult[] = rawResults.map((r) => ({
        id: r.id,
        name: (r.name as string) || 'Analysis Result',
        type: (r.result_type as string) || 'Unknown',
        createdAt: new Date(r.created_at as string),
        ...(r as unknown as Record<string, unknown>),
      }));

      return {
        results,
        totalCount: data.total_count,
        offset: pageParam,
        hasMore:
          results.length > 0 && pageParam + results.length < data.total_count,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.results.length > 0
        ? lastPage.offset + lastPage.results.length
        : undefined,
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}
