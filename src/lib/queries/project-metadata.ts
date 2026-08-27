/**
 * Hook to fetch project metadata (dataset count and last activity)
 * Used by ProjectCard on the home page to show accurate counts without navigating into the project
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { logger } from '@/lib/logger';
import { getRelativeTime } from '@/lib/utils/date-utils';
import { getApiBaseUrl } from '@/lib/api/get-api-base';

interface ProjectMetadata {
  datasetCount: number;
  lastActivity: string;
}

const IS_MOCK = ['mock', 'live'].includes(
  process.env.NEXT_PUBLIC_DATA_MODE || 'mock'
);

/**
 * Fetch dataset count and last activity for a project
 */
async function fetchProjectMetadata(
  projectId: string
): Promise<ProjectMetadata> {
  if (IS_MOCK) {
    // Return mock data
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      datasetCount: Math.floor(Math.random() * 5),
      lastActivity: '2 hours ago',
    };
  }

  const apiUrl = getApiBaseUrl();

  // Shared request configuration
  const requestConfig = {
    method: 'GET',
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Fetch datasets count and most recent activity in parallel
  // We wrap the activities fetch in a catch block so a failure there doesn't block the dataset count
  const [datasetsResponse, activitiesResponse] = await Promise.all([
    fetch(
      `${apiUrl}/projects/${projectId}/files?page=1&limit=1`,
      requestConfig
    ),
    fetch(
      `${apiUrl}/projects/${projectId}/activities?page=1&limit=1`,
      requestConfig
    ).catch((err) => {
      logger.warn({ err, projectId }, 'Failed to fetch project activities');
      // Return a plain object mimicking a 500 response so the promise resolves but .ok is false
      // Using a plain object avoids issues if Response global is not available in all environments
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ data: [] }),
      } as Response;
    }),
  ]);

  if (!datasetsResponse.ok) {
    throw new Error(
      `Failed to fetch datasets: ${datasetsResponse.status} ${datasetsResponse.statusText}`
    );
  }

  const datasetsData = await datasetsResponse.json();
  const datasetCount = datasetsData.total || 0;

  let lastActivity = 'No recent activity';

  if (activitiesResponse.ok) {
    const activitiesData = await activitiesResponse.json();
    const activities = activitiesData.data || [];

    if (activities.length > 0) {
      const mostRecent = activities[0];
      const activityDate = new Date(mostRecent.created_at);
      lastActivity = getRelativeTime(activityDate);
    }
  }

  logger.info(
    { projectId, datasetCount, lastActivity },
    'Fetched project metadata'
  );

  return { datasetCount, lastActivity };
}

/**
 * Hook to fetch and cache project metadata
 */
export function useProjectMetadata(projectId: string) {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: ['project-metadata', projectId],
    queryFn: () => fetchProjectMetadata(projectId),
    enabled: isAuthenticated,
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
