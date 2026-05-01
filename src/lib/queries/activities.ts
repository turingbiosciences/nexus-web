/**
 * Query hook for fetching project activities using createAuthQuery factory
 */

import { ProjectActivity } from '@/types/project';
import { projectsRepository } from '@/data';
import { createAuthQuery, extractItems } from './create-auth-query';

interface UseActivitiesOptions {
  enabled?: boolean;
  limit?: number;
}

interface ApiActivity {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  project_id?: string;
  activity_metadata?: unknown;
}

type ApiResponse =
  | ApiActivity[]
  | { items?: ApiActivity[]; activities?: ApiActivity[] };

/**
 * Map API event_type to internal ProjectActivity type
 */
function mapEventTypeToActivityType(
  eventType: string
): ProjectActivity['type'] {
  switch (eventType) {
    case 'file_uploaded':
      return 'upload';
    case 'project_updated':
      return 'updated';
    case 'project_created':
      return 'created';
    case 'status_change':
    case 'project_status_changed':
      return 'status_change';
    case 'file_deleted':
    case 'dataset_deleted':
      return 'delete';
    default:
      return 'updated';
  }
}

/**
 * Transform API response to ProjectActivity array
 */
function transformActivities(response: ApiResponse): ProjectActivity[] {
  const items = extractItems<ApiActivity>(response);

  return items.map((a) => ({
    id: a.id,
    type: mapEventTypeToActivityType(a.event_type),
    message: a.description,
    at: new Date(a.created_at),
  }));
}

/**
 * Build query params from options
 */
function buildParams(options?: UseActivitiesOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  return params;
}

/**
 * Hook to fetch project activities
 */
export const useActivities = createAuthQuery<
  ProjectActivity[],
  ApiResponse,
  UseActivitiesOptions
>({
  queryKeyPrefix: 'activities',
  getEndpoint: (projectId) => `/projects/${projectId}/activities`,
  fetchMock: async (projectId) => {
    // ⚡ Bolt: Replaced O(N) list traversal with O(1) map lookup
    const project = await projectsRepository.get(projectId);
    return project?.activities || [];
  },
  transformResponse: transformActivities,
  buildParams,
  refetchOnMount: 'always',
});
