"use client";

import { useResults } from "@/lib/queries/results";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { ModelPerformanceTable } from "./model-performance-table";
import { FeatureImportanceSection } from "./feature-importance-section";
// import { NormalizedFeatureImportanceChart } from "./normalized-feature-importance-chart";
import { FeatureComparisonChart } from "./feature-comparison-chart";
import { AggregateFeatureImportanceTable } from "./aggregate-feature-importance-table";
import { ModelFeatureImportanceCharts } from "./model-feature-importance-charts";
import { ModelConfig } from "@/types/model-config";

interface ResultsSectionProps {
  projectId: string;
}

export function ResultsSection({ projectId }: ResultsSectionProps) {
  const resultsQuery = useResults(projectId);
  const results = useMemo(() => {
    const data = resultsQuery.data || [];
    // Sort by createdAt in descending order (newest first)
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [resultsQuery.data]);
  const resultsLoading = resultsQuery.isLoading;
  const [showRawData, setShowRawData] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set()
  );

  // Initialize expanded state with the first result when results load
  useEffect(() => {
    if (results.length > 0 && expandedResults.size === 0) {
      const firstResultKey = results[0]?.id || "result-0";
      setExpandedResults(new Set([firstResultKey]));
    }
  }, [results, expandedResults.size]);

  const toggleExpand = (resultId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

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

            {/* Results List */}
            <ul className="space-y-3">
              {results.map((result, index) => {
                const resultKey = result.id || `result-${index}`;
                const isExpanded = expandedResults.has(resultKey);
                const modelConfigs = (
                  result as {
                    data?: { all_model_configs?: Record<string, ModelConfig> };
                  }
                ).data?.all_model_configs;

                return (
                  <li
                    key={resultKey}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {/* Header - Always Visible */}
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      onClick={() => toggleExpand(resultKey)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(resultKey);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {result.name}
                          </h4>
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {result.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-400">
                          {result.createdAt.toLocaleDateString()}{" "}
                          {result.createdAt.toLocaleTimeString()}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t p-4 bg-gray-50 space-y-6">
                        {modelConfigs &&
                          Object.keys(modelConfigs).length > 0 ? (
                          <>
                            <ModelPerformanceTable
                              modelConfigs={modelConfigs}
                            />
                            <FeatureImportanceSection
                              modelConfigs={modelConfigs}
                            />
                            {/* Aggregate Feature Importance Table */}
                            {(
                              result as unknown as {
                                data?: {
                                  aggregate_feature_importance?: {
                                    top_features: Array<{
                                      feature: string;
                                      mean_importance: number;
                                      sum_importance: number;
                                      max_importance: number;
                                      min_importance: number;
                                      std_importance: number;
                                      weighted_score: number;
                                      num_models: number;
                                      models: string[];
                                    }>;
                                  };
                                };
                              }
                            ).data?.aggregate_feature_importance && (
                                <AggregateFeatureImportanceTable
                                  data={
                                    (
                                      result as unknown as {
                                        data: {
                                          aggregate_feature_importance: {
                                            top_features: Array<{
                                              feature: string;
                                              mean_importance: number;
                                              sum_importance: number;
                                              max_importance: number;
                                              min_importance: number;
                                              std_importance: number;
                                              weighted_score: number;
                                              num_models: number;
                                              models: string[];
                                            }>;
                                          };
                                        };
                                      }
                                    ).data.aggregate_feature_importance
                                  }
                                />
                              )}
                            {/* Normalized Feature Importance - COMMENTED OUT FOR NOW */}
                            {/* {(
                              result as {
                                data?: {
                                  normalized_feature_importances?: Record<
                                    string,
                                    unknown
                                  >;
                                };
                              }
                            ).data?.normalized_feature_importances && (
                              <NormalizedFeatureImportanceChart
                                data={
                                  (
                                    result as {
                                      data?: {
                                        normalized_feature_importances?: Record<
                                          string,
                                          unknown
                                        >;
                                      };
                                    }
                                  ).data!.normalized_feature_importances!
                                }
                              />
                            )} */}
                            {/* Feature Importance by Rank Charts */}
                            <ModelFeatureImportanceCharts
                              modelConfigs={modelConfigs}
                            />
                            {/* Feature Comparison Chart */}
                            {(
                              result as {
                                data?: {
                                  feature_comparison?: Record<string, unknown>;
                                };
                              }
                            ).data?.feature_comparison && (
                                <FeatureComparisonChart
                                  data={
                                    (
                                      result as {
                                        data?: {
                                          feature_comparison?: Record<
                                            string,
                                            unknown
                                          >;
                                        };
                                      }
                                    ).data!.feature_comparison!
                                  }
                                />
                              )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No model performance data available for this result.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
