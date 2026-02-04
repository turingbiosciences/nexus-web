/**
 * Query hook for fetching project results using createAuthQuery factory
 */

import { ProjectResult } from '@/types/project';
import { projectsRepository } from '@/data';
import { createAuthQuery, extractItems } from './create-auth-query';

interface UseResultsOptions {
  enabled?: boolean;
}

interface ApiResult {
  id: string;
  name?: string;
  type?: string;
  result_type?: string;
  created_at: string;
  size?: number;
  url?: string;
}

type ApiResponse = ApiResult[] | { items?: ApiResult[]; results?: ApiResult[] };

/**
 * Transform API response to ProjectResult array
 */
function transformResults(response: ApiResponse): ProjectResult[] {
  const items = extractItems<ApiResult>(response);

  return items.map((r) => ({
    id: r.id,
    name: r.name || 'Analysis Result',
    type: r.type || r.result_type || 'Unknown',
    createdAt: new Date(r.created_at),
    size: r.size,
    url: r.url,
    // Preserve all raw data for analysis
    ...(r as unknown as Record<string, unknown>),
  }));
}

/**
 * Hook to fetch project results
 */
export const useResults = createAuthQuery<
  ProjectResult[],
  ApiResponse,
  UseResultsOptions
>({
  queryKeyPrefix: 'results',
  getEndpoint: (projectId) => `/projects/${projectId}/results`,
  fetchMock: async (projectId) => {
    const projects = await projectsRepository.list();
    const project = projects.find((p) => p.id === projectId);
    return project?.results || [];
  },
  transformResponse: transformResults,
  refetchOnMount: 'always',
});
