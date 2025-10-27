import { useQuery } from "@tanstack/react-query";
import { datasetsKey } from "@/lib/queries/keys";
import { ProjectDataset } from "@/types/project";
import { IS_MOCK } from "@/config/flags";
import { projectsRepository } from "@/data";

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
  opts?: { cursor?: string; limit?: number }
) {
  const base = process.env.NEXT_PUBLIC_TURING_API;
  if (!base) throw new Error("Missing NEXT_PUBLIC_TURING_API env var");
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const url = `${base}/projects/${projectId}/datasets${
    params.size ? `?${params.toString()}` : ""
  }`;
  const res = await fetch(url, {
    headers: {
      // Authorization header will be injected later via an authenticated fetch wrapper
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch datasets (${res.status})`);
  // Support both array (legacy) and paginated shape { items, nextCursor, total }
  const json = await res.json();
  const items: ApiDataset[] = Array.isArray(json) ? json : json.items;
  const mapped: ProjectDataset[] = items.map((d) => ({
    id: d.id,
    filename: d.filename,
    size: d.size,
    uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
  }));
  return {
    items: mapped,
    nextCursor: Array.isArray(json) ? undefined : json.nextCursor,
    total: Array.isArray(json) ? mapped.length : json.total,
  };
}

async function fetchDatasets(
  projectId: string,
  opts?: { cursor?: string; limit?: number }
) {
  if (IS_MOCK) {
    return projectsRepository.listDatasets(projectId, opts);
  }
  return fetchDatasetsViaApi(projectId, opts);
}

export function useDatasets(
  projectId: string,
  enabledOrOptions: boolean | UseDatasetsOptions = true
) {
  const options: UseDatasetsOptions =
    typeof enabledOrOptions === "boolean"
      ? { enabled: enabledOrOptions }
      : enabledOrOptions;
  const { enabled = true, cursor, limit, paginated } = options;
  const query = useQuery({
    queryKey: datasetsKey(projectId, cursor, limit),
    queryFn: () => fetchDatasets(projectId, { cursor, limit }),
    enabled: enabled && !!projectId,
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
