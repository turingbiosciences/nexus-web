import { useQuery } from "@tanstack/react-query";
import { datasetsKey } from "@/lib/queries/keys";
import { ProjectDataset } from "@/types/project";
import { IS_MOCK } from "@/config/flags";
import { projectsRepository } from "@/data";
import { useAccessToken } from "@/components/providers/token-provider";
import { authFetch } from "@/lib/auth-fetch";
import { logger } from "@/lib/logger";

interface UseDatasetsOptions {
  enabled?: boolean;
  cursor?: string;
  limit?: number;
  // When true, return full pagination object instead of just array of items (future use)
  paginated?: boolean;
}

interface ApiDataset {
  id: string;
  filename: string;
  size: number;
  uploadedAt?: string;
}

async function fetchDatasetsViaApi(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>,
  opts?: { cursor?: string; limit?: number }
) {
  const base = process.env.NEXT_PUBLIC_TURING_API;
  if (!base) throw new Error("Missing NEXT_PUBLIC_TURING_API env var");
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.limit) params.set("limit", String(opts.limit));
  // Updated endpoint to match backend API: /projects/[id]/files instead of /datasets
  const url = `${base}/projects/${projectId}/files${
    params.size ? `?${params.toString()}` : ""
  }`;

  logger.debug({ projectId, url }, "Fetching datasets");

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
      "Failed to fetch datasets"
    );
    throw new Error(`Failed to fetch datasets (${res.status})`);
  }

  // Support both array (legacy) and paginated shape { items, nextCursor, total }
  const json = await res.json();
  logger.debug(
    { projectId, isArray: Array.isArray(json) },
    "Datasets response received"
  );

  const items: ApiDataset[] = Array.isArray(json) ? json : json.items;
  const mapped: ProjectDataset[] = items.map((d) => ({
    id: d.id,
    filename: d.filename,
    size: d.size,
    uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
  }));

  logger.debug(
    { projectId, count: mapped.length },
    "Datasets mapped successfully"
  );

  return {
    items: mapped,
    nextCursor: Array.isArray(json) ? undefined : json.nextCursor,
    total: Array.isArray(json) ? mapped.length : json.total,
  };
}

async function fetchDatasets(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>,
  opts?: { cursor?: string; limit?: number }
) {
  if (IS_MOCK) {
    return projectsRepository.listDatasets(projectId, opts);
  }
  return fetchDatasetsViaApi(projectId, accessToken, onTokenRefresh, opts);
}

export function useDatasets(
  projectId: string,
  enabledOrOptions: boolean | UseDatasetsOptions = true
) {
  const { accessToken, isAuthenticated, refreshToken } = useAccessToken();
  const options: UseDatasetsOptions =
    typeof enabledOrOptions === "boolean"
      ? { enabled: enabledOrOptions }
      : enabledOrOptions;
  const { enabled = true, cursor, limit, paginated } = options;
  const query = useQuery({
    queryKey: datasetsKey(projectId, cursor, limit),
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }
      return fetchDatasets(projectId, accessToken, refreshToken, {
        cursor,
        limit,
      });
    },
    enabled: enabled && !!projectId && isAuthenticated && !!accessToken,
    staleTime: 30_000,
  });
  // Preserve existing API: if not paginated, surface items array as data for backwards compatibility
  if (!paginated) {
    return {
      ...query,
      data: query.data?.items as ProjectDataset[] | undefined,
      nextCursor: query.data?.nextCursor,
      total: query.data?.total,
    } as typeof query & {
      data: ProjectDataset[] | undefined;
      nextCursor?: string;
      total?: number;
    };
  }
  return query; // caller will handle .data.items
}
