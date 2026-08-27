/**
 * Generic factory for creating authenticated React Query hooks.
 * This eliminates the repeated boilerplate in query hook files.
 */

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { authFetch } from '@/lib/auth-fetch';
import { logger } from '@/lib/logger';
import { getApiBaseUrl } from '@/lib/api/get-api-base';
import { IS_MOCK } from '@/config/flags';

/**
 * Configuration for creating an authenticated query hook
 */
export interface AuthQueryConfig<TResult, TApiResponse, TOptions = object> {
  /** Query key prefix (e.g., "datasets", "activities") */
  queryKeyPrefix: string;

  /** API endpoint path (without base URL, e.g., "/projects/{projectId}/files") */
  getEndpoint: (projectId: string, options?: TOptions) => string;

  /** Function to fetch mock data */
  fetchMock: (projectId: string, options?: TOptions) => Promise<TResult>;

  /** Function to transform API response to result type */
  transformResponse: (response: TApiResponse, projectId: string) => TResult;

  /** Build query params from options */
  buildParams?: (options?: TOptions) => URLSearchParams;

  /** Default stale time in ms (defaults to 30000) */
  staleTime?: number;

  /** Whether to refetch on mount (defaults to false) */
  refetchOnMount?: boolean | 'always';
}

/**
 * Options passed to the query hook
 */
export interface BaseQueryOptions {
  enabled?: boolean;
}

/**
 * Fetch data from the API through the same-origin proxy, which authenticates
 * the request server-side.
 */
async function fetchFromApi<TApiResponse>(
  endpoint: string,
  params?: URLSearchParams
): Promise<TApiResponse> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}${params?.size ? `?${params.toString()}` : ''}`;

  logger.debug({ url }, 'Fetching from API');

  const res = await authFetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error({ url, status: res.status, errorText }, 'API request failed');
    throw new Error(`API request failed (${res.status})`);
  }

  return res.json();
}

/**
 * Create an authenticated query hook with the given configuration.
 *
 * @example
 * ```ts
 * export const useDatasets = createAuthQuery({
 *   queryKeyPrefix: "datasets",
 *   getEndpoint: (projectId) => `/projects/${projectId}/files`,
 *   fetchMock: (projectId) => projectsRepository.listDatasets(projectId),
 *   transformResponse: (response) => response.items.map(mapDataset),
 * });
 * ```
 */
export function createAuthQuery<
  TResult,
  TApiResponse,
  TOptions extends BaseQueryOptions = BaseQueryOptions,
>(config: AuthQueryConfig<TResult, TApiResponse, TOptions>) {
  const {
    queryKeyPrefix,
    getEndpoint,
    fetchMock,
    transformResponse,
    buildParams,
    staleTime = 30_000,
    refetchOnMount = false,
  } = config;

  return function useAuthQuery(
    projectId: string,
    options?: TOptions
  ): UseQueryResult<TResult, Error> {
    const { isAuthenticated } = useAuthState();
    const { enabled = true, ...restOptions } = options || ({} as TOptions);

    // Build query key including relevant options
    const queryKey = [queryKeyPrefix, projectId, restOptions];

    return useQuery({
      queryKey,
      queryFn: async (): Promise<TResult> => {
        if (IS_MOCK) {
          logger.debug({ projectId, queryKeyPrefix }, 'Using mock data');
          return fetchMock(projectId, options);
        }

        logger.debug({ projectId, queryKeyPrefix }, 'Fetching from API');
        const endpoint = getEndpoint(projectId, options);
        const params = buildParams?.(options);

        const response = await fetchFromApi<TApiResponse>(endpoint, params);

        return transformResponse(response, projectId);
      },
      enabled: enabled && !!projectId && isAuthenticated,
      staleTime,
      refetchOnMount,
    } as UseQueryOptions<TResult, Error>);
  };
}

/**
 * Helper to extract items from API response that may be array or object with items property
 * Supports various API response formats: items, data, activities, results
 */
export function extractItems<T>(
  response:
    | T[]
    | { items?: T[]; data?: T[]; activities?: T[]; results?: T[] }
    | Record<string, unknown>
): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (typeof response === 'object' && response !== null) {
    const obj = response as {
      items?: T[];
      data?: T[];
      activities?: T[];
      results?: T[];
    };
    return obj.items || obj.data || obj.activities || obj.results || [];
  }
  return [];
}

/**
 * Helper to extract pagination info from API response
 */
export function extractPagination(response: unknown): {
  nextCursor?: string;
  total?: number;
} {
  if (
    typeof response === 'object' &&
    response !== null &&
    !Array.isArray(response)
  ) {
    const obj = response as { nextCursor?: string; total?: number };
    return {
      nextCursor: obj.nextCursor,
      total: obj.total,
    };
  }
  return {};
}
