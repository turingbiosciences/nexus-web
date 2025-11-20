/**
 * Hook to fetch project metadata (dataset count and last activity)
 * Used by ProjectCard on the home page to show accurate counts without navigating into the project
 */

import { useQuery } from "@tanstack/react-query";
import { useAccessToken } from "@/components/providers/token-provider";
import { logger } from "@/lib/logger";
import { getRelativeTime } from "@/lib/utils/date-utils";

interface ProjectMetadata {
  datasetCount: number;
  lastActivity: string;
}

const IS_MOCK = ["mock", "live"].includes(
  process.env.NEXT_PUBLIC_DATA_MODE || "mock"
);

/**
 * Fetch dataset count and last activity for a project
 */
async function fetchProjectMetadata(
  projectId: string,
  accessToken: string
): Promise<ProjectMetadata> {
  if (IS_MOCK) {
    // Return mock data
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      datasetCount: Math.floor(Math.random() * 5),
      lastActivity: "2 hours ago",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  const apiUrl = baseUrl.replace(/\/$/, "");

  // Fetch datasets to get count
  const datasetsResponse = await fetch(
    `${apiUrl}/projects/${projectId}/files?page=1&limit=1`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!datasetsResponse.ok) {
    throw new Error(
      `Failed to fetch datasets: ${datasetsResponse.status} ${datasetsResponse.statusText}`
    );
  }

  const datasetsData = await datasetsResponse.json();
  const datasetCount = datasetsData.total || 0;

  // Fetch most recent activity
  const activitiesResponse = await fetch(
    `${apiUrl}/projects/${projectId}/activities?page=1&limit=1`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  let lastActivity = "No recent activity";

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
    "Fetched project metadata"
  );

  return { datasetCount, lastActivity };
}

/**
 * Hook to fetch and cache project metadata
 */
export function useProjectMetadata(projectId: string) {
  const { accessToken } = useAccessToken();

  return useQuery({
    queryKey: ["project-metadata", projectId],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("No access token available");
      }
      return fetchProjectMetadata(projectId, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
