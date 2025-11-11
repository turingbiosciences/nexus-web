import { useQuery } from "@tanstack/react-query";
import { ProjectActivity } from "@/types/project";
import { IS_MOCK } from "@/config/flags";
import { projectsRepository } from "@/data";
import { useAccessToken } from "@/components/providers/token-provider";
import { authFetch } from "@/lib/auth-fetch";

interface UseActivitiesOptions {
  enabled?: boolean;
  limit?: number;
}

interface ApiActivity {
  id: string;
  type: string;
  message: string;
  timestamp?: string;
  createdAt?: string;
}

async function fetchActivitiesViaApi(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>,
  opts?: { limit?: number }
) {
  const base = process.env.NEXT_PUBLIC_TURING_API;
  if (!base) throw new Error("Missing NEXT_PUBLIC_TURING_API env var");

  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));

  const url = `${base}/projects/${projectId}/activities${
    params.size ? `?${params.toString()}` : ""
  }`;

  console.log("🔔 Fetching activities from:", url);

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
    console.error("Failed to fetch activities:", res.status, errorText);
    throw new Error(`Failed to fetch activities (${res.status})`);
  }

  const json = await res.json();
  console.log("🔔 Activities response:", json);

  // Support both array and object with items property
  const items: ApiActivity[] = Array.isArray(json)
    ? json
    : json.items || json.activities || [];

  const mapped: ProjectActivity[] = items.map((a) => ({
    id: a.id,
    type: a.type as ProjectActivity["type"],
    message: a.message,
    at: a.timestamp
      ? new Date(a.timestamp)
      : a.createdAt
      ? new Date(a.createdAt)
      : new Date(),
  }));

  console.log("🔔 Mapped activities:", mapped);

  return mapped;
}

async function fetchActivities(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>,
  opts?: { limit?: number }
) {
  if (IS_MOCK) {
    const projects = await projectsRepository.list();
    const project = projects.find((p) => p.id === projectId);
    return project?.activities || [];
  }
  return fetchActivitiesViaApi(projectId, accessToken, onTokenRefresh, opts);
}

export function useActivities(
  projectId: string,
  options: UseActivitiesOptions = {}
) {
  const { accessToken, isAuthenticated, refreshToken } = useAccessToken();
  const { enabled = true, limit = 20 } = options;

  return useQuery({
    queryKey: ["activities", projectId, limit],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }
      return fetchActivities(projectId, accessToken, refreshToken, { limit });
    },
    enabled: enabled && !!projectId && isAuthenticated && !!accessToken,
    staleTime: 30_000,
  });
}
