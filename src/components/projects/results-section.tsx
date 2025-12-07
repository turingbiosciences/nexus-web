"use client";

import { useResults } from "@/lib/queries/results";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { FeatureImportanceChart } from "./feature-importance-chart";

interface ResultsSectionProps {
  projectId: string;
}

interface ModelConfig {
  best_config?: string;
  test_metrics?: {
    roc?: number;
    [key: string]: any;
  };
  configs?: Record<string, {
    config: Record<string, any>;
    features?: Array<{
      name: string;
      importance: number;
    }> | Record<string, number>;
  }>;
}

export function ResultsSection({ projectId }: ResultsSectionProps) {
  const resultsQuery = useResults(projectId);
  const results = resultsQuery.data || [];
  const resultsLoading = resultsQuery.isLoading;
  const [showRawData, setShowRawData] = useState(false);

  // Extract all_model_configs from the first result (assuming single training result)
  const allModelConfigs: Record<string, ModelConfig> | undefined =
    results[0]?.data?.all_model_configs;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Analysis Results</h3>
        {results.length > 0 && (
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            {showRawData ? "Hide" : "Show"} Raw Data
          </button>
        )}
      </div>
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
          <>
            {/* Raw Data View */}
            {showRawData && (
              <div className="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-200">
                    Raw API Response ({results.length} result
                    {results.length !== 1 ? "s" : ""})
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(results, null, 2)
                      );
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="text-xs overflow-auto max-h-96 bg-gray-950 p-4 rounded border border-gray-800 font-mono">
                  <code className="text-gray-100">
                    {JSON.stringify(results, null, 2)}
                  </code>
                </pre>
              </div>
            )}

            {/* AUROC Metrics Table */}
            {allModelConfigs && Object.keys(allModelConfigs).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Model Performance (AUROC)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                          Model
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                          AUROC Score
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                          Best Configuration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(allModelConfigs)
                        .filter(
                          ([_, config]) =>
                            config.test_metrics?.roc !== undefined
                        )
                        .sort(
                          ([_, a], [__, b]) =>
                            (b.test_metrics?.roc || 0) -
                            (a.test_metrics?.roc || 0)
                        )
                        .slice(0, 10)
                        .map(([modelName, config]) => {
                          const auroc = config.test_metrics?.roc || 0;
                          const formattedModelName = modelName
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ");

                          return (
                            <tr
                              key={modelName}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formattedModelName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={
                                    auroc >= 0.9
                                      ? "text-green-700 font-semibold"
                                      : auroc >= 0.8
                                        ? "text-blue-700 font-medium"
                                        : "text-gray-700"
                                  }
                                >
                                  {auroc.toFixed(4)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {config.best_config || "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feature Importance Charts */}
            {allModelConfigs && Object.keys(allModelConfigs).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Feature Importance by Model
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(allModelConfigs).map(
                    ([modelName, modelConfig]) => {
                      // Get the best config name
                      const bestConfigName = modelConfig.best_config;
                      if (!bestConfigName || !modelConfig.configs) {
                        return null;
                      }

                      const configData =
                        modelConfig.configs[bestConfigName];
                      if (!configData) {
                        return null;
                      }

                      // Extract feature importance from the model level (not config level)
                      const featureImportance =
                        modelConfig.feature_importance;
                      if (
                        !featureImportance ||
                        (typeof featureImportance === "object" &&
                          Object.keys(featureImportance).length === 0)
                      ) {
                        return null;
                      }

                      return (
                        <FeatureImportanceChart
                          key={modelName}
                          modelName={modelName}
                          bestConfig={bestConfigName}
                          featureImportance={featureImportance}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Results List */}
            <ul className="space-y-3">
              {results.map((result, index) => (
                <li
                  key={result.id || `result-${index}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {result.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.type}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {result.createdAt.toLocaleDateString()}
                    </div>
                  </div>

                  {/* Display all properties from the result */}
                  <details className="mt-3">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      View Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                      <pre className="overflow-auto text-xs font-mono">
                        <code className="text-gray-100">
                          {JSON.stringify(result, null, 2)}
                        </code>
                      </pre>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
