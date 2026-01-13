import { useQuery } from "@tanstack/react-query";
import { ProjectResult } from "@/types/project";
import { IS_MOCK } from "@/config/flags";
import { projectsRepository } from "@/data";
import { useAccessToken } from "@/components/providers/token-provider";
import { authFetch } from "@/lib/auth-fetch";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/api/get-api-base";

interface UseResultsOptions {
  enabled?: boolean;
}

interface ApiResult {
  id: string;
  name: string;
  type: string;
  created_at: string;
  size?: number;
  url?: string;
}

async function fetchResultsViaApi(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>
): Promise<ProjectResult[]> {
  const base = getApiBaseUrl();

  const url = `${base}/projects/${projectId}/results`;
  logger.debug({ projectId, url }, "Fetching results from API");

  const res = await authFetch(url, {
    method: "GET",
    token: accessToken,
    onTokenRefresh,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error(
      { projectId, status: res.status, errorText },
      "Failed to fetch results from API"
    );
    throw new Error(`Failed to fetch results (${res.status})`);
  }

  const json = await res.json();
  logger.debug(
    {
      projectId,
      rawResponse: json,
    },
    "Raw results API response"
  );

  // Support both array and object with items/results property
  const items: ApiResult[] = Array.isArray(json)
    ? json
    : json.items || json.results || [];

  logger.debug(
    {
      projectId,
      count: items.length,
    },
    "Results API response received"
  );

  // Map to ProjectResult but preserve all original data
  const mapped: ProjectResult[] = items.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    createdAt: new Date(r.created_at),
    size: r.size,
    url: r.url,
    // Preserve all raw data for analysis
    ...(r as unknown as Record<string, unknown>),
  }));

  logger.debug(
    { projectId, count: mapped.length },
    "Results mapped successfully"
  );

  return mapped;
}

async function fetchResults(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>
) {
  if (IS_MOCK) {
    logger.info({ projectId, IS_MOCK }, "Using mock results data");
    const projects = await projectsRepository.list();
    const project = projects.find((p) => p.id === projectId);
    return project?.results || [];
  }
  logger.info({ projectId, IS_MOCK }, "Using API for results data");
  return fetchResultsViaApi(projectId, accessToken, onTokenRefresh);
}

export function useResults(projectId: string, options: UseResultsOptions = {}) {
  const { accessToken, isAuthenticated, refreshToken } = useAccessToken();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["results", projectId],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }
      return fetchResults(projectId, accessToken, refreshToken);
    },
    enabled: enabled && !!projectId && isAuthenticated && !!accessToken,
    staleTime: 30_000,
    refetchOnMount: "always", // Always refetch when component mounts to get fresh results data
  });
}
