"use client";

import { useResults } from "@/lib/queries/results";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsSectionProps {
  projectId: string;
}

export function ResultsSection({ projectId }: ResultsSectionProps) {
  const resultsQuery = useResults(projectId);
  const results = resultsQuery.data || [];
  const resultsLoading = resultsQuery.isLoading;

  return (
    <div className="card">
      <h3 className="card-title">Analysis Results</h3>
      <div className="space-y-4">
        {resultsLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton width="66%" height="1rem" className="mb-2" />
                <Skeleton width="50%" height="0.75rem" />
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
                    {result.createdAt.toLocaleDateString()}
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
