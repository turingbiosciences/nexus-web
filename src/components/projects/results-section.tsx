"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccessToken } from "@/components/providers/token-provider";
import { authFetch } from "@/lib/auth-fetch";

interface ProjectResult {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  // Add other result properties as needed
}

interface ResultsSectionProps {
  projectId: string;
}

async function fetchResults(
  projectId: string,
  accessToken: string,
  onTokenRefresh: () => Promise<string | null>
): Promise<ProjectResult[]> {
  const base = process.env.NEXT_PUBLIC_TURING_API;
  if (!base) throw new Error("Missing NEXT_PUBLIC_TURING_API env var");

  const url = `${base}/projects/${projectId}/results`;
  console.log("📊 Fetching results from:", url);

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
    console.error("Failed to fetch results:", res.status, errorText);
    throw new Error(`Failed to fetch results (${res.status})`);
  }

  const json = await res.json();
  console.log("📊 Results response:", json);

  // Support both array and object with items/results property
  const items: ProjectResult[] = Array.isArray(json)
    ? json
    : json.items || json.results || [];

  return items;
}

export function ResultsSection({ projectId }: ResultsSectionProps) {
  const { accessToken, isAuthenticated, refreshToken } = useAccessToken();

  const resultsQuery = useQuery({
    queryKey: ["results", projectId],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }
      return fetchResults(projectId, accessToken, refreshToken);
    },
    enabled: !!projectId && isAuthenticated && !!accessToken,
    staleTime: 30_000,
  });

  const results = resultsQuery.data || [];
  const resultsLoading = resultsQuery.isLoading;

  return (
    <div className="card">
      <h3 className="card-title">Analysis Results</h3>
      <div className="space-y-4">
        {resultsLoading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}
        {!resultsLoading && (!results || results.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No results available yet.</p>
            <p className="text-xs text-gray-500 mt-1">
              Results will appear here once analysis is complete.
            </p>
          </div>
        )}
        {!resultsLoading && results && results.length > 0 && (
          <ul className="space-y-3">
            {results.map((result) => (
              <li
                key={result.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{result.type}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
