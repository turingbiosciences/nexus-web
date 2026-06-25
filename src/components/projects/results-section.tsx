'use client';

import { useResults } from '@/lib/queries/results';
import { useDatasets } from '@/lib/queries/datasets';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { ModelPerformanceTable } from './model-performance-table';
import { FeatureImportanceSection } from './feature-importance-section';
// import { NormalizedFeatureImportanceChart } from "./normalized-feature-importance-chart";
import { FeatureComparisonChart } from './feature-comparison-chart';
import { AggregateFeatureImportanceTable } from './aggregate-feature-importance-table';
import { ModelFeatureImportanceCharts } from './model-feature-importance-charts';
import { ModelConfig } from '@/types/model-config';
import { CARTAnalysisSection } from './cart-analysis-section';
import {
  StatisticalAnalysisSection,
  StatisticalAnalysisData,
} from './statistical-analysis-section';
import { ShapImportanceSection } from './shap-importance-section';
import { ParsimoniousResultsSection } from './parsimonious-results-section';
import {
  ConvergenceTableSection,
  ConvergenceTableData,
} from './convergence-table-section';
import { Download } from 'lucide-react';
import { useAccessToken } from '@/components/providers/token-provider';
import { authFetch } from '@/lib/auth-fetch';
import { getApiUrl } from '@/lib/api/utils';
import { useToast } from '@/components/ui/toast-provider';

interface AnalysisResult {
  data?: {
    run_parameters?: {
      file_id?: string;
      target_column?: string;
      exclude_columns?: string[];
    };
    training_started_at?: string;
    training_completed_at?: string;
    all_model_configs?: Record<string, ModelConfig>;
    graph_svg_url?: string | null;
    analysis_report_url?: string | null;
    statistical_analysis?: StatisticalAnalysisData | null;
    converging_features?: string[] | null;
    parsimonious_model_configs?: Record<string, ModelConfig> | null;
    convergence_table?: ConvergenceTableData | null;
  };
}

function formatDuration(startIso: string, endIso: string): string | null {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return null;
  const secs = Math.max(0, Math.round((end - start) / 1000));
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

interface ResultsSectionProps {
  projectId: string;
}

export function ResultsSection({ projectId }: ResultsSectionProps) {
  const resultsQuery = useResults(projectId);
  const { data: datasetsRaw } = useDatasets(projectId);
  const datasetMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(datasetsRaw)) {
      datasetsRaw.forEach((d) => map.set(d.id, d.filename));
    }
    return map;
  }, [datasetsRaw]);

  // Flatten all loaded pages — backend returns newest first so no client sort needed
  const results = useMemo(
    () => resultsQuery.data?.pages.flatMap((p) => p.results) ?? [],
    [resultsQuery.data]
  );
  const totalCount = resultsQuery.data?.pages[0]?.totalCount ?? 0;
  const resultsLoading = resultsQuery.isLoading;
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set()
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const { accessToken, refreshToken } = useAccessToken();
  const { push: pushToast } = useToast();

  // Reset expansion state when project changes
  useEffect(() => {
    setExpandedResults(new Set());
  }, [projectId]);

  // Initialize expanded state with the first result when results load
  useEffect(() => {
    if (results.length > 0 && expandedResults.size === 0) {
      const firstResultKey = results[0]?.id || 'result-0';
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

  const handleDownload = async () => {
    if (!accessToken) {
      pushToast({
        title: 'Sign in Required',
        description: 'You must be signed in to download results.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await authFetch(
        `${apiUrl}/projects/${projectId}/download`,
        {
          token: accessToken,
          onTokenRefresh: refreshToken,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;
        throw new Error(`Server Error (${response.status}): ${errorMessage}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}-results.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      pushToast({
        title: 'Download Started',
        description: 'Your results are being downloaded.',
        variant: 'default',
      });
    } catch (error) {
      let errorTitle = 'Download Failed';
      let errorDescription = 'An unexpected error occurred. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Server Error')) {
          errorTitle = 'Server Error';
          errorDescription = error.message;
        } else if (
          error.name === 'TypeError' &&
          error.message.includes('fetch')
        ) {
          errorTitle = 'Network Error';
          errorDescription =
            'Please check your internet connection and try again.';
        } else {
          errorDescription = error.message;
        }
      }

      pushToast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 0,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="card-title mb-0">Analysis Results</h3>
        {results.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download Results'}
          </Button>
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
            {/* Results List */}
            <ul className="space-y-3">
              {results.map((result, index) => {
                const resultKey = result.id || `result-${index}`;
                const isExpanded = expandedResults.has(resultKey);
                const resultData = (result as unknown as AnalysisResult).data;
                const runParams = resultData?.run_parameters;
                const trainingDuration =
                  resultData?.training_started_at &&
                  resultData?.training_completed_at
                    ? formatDuration(
                        resultData.training_started_at,
                        resultData.training_completed_at
                      )
                    : null;
                const datasetFilename = runParams?.file_id
                  ? (datasetMap.get(runParams.file_id) ?? runParams.file_id)
                  : result.name;
                const targetColumn = runParams?.target_column;
                const excludeColumns = runParams?.exclude_columns ?? [];
                const modelConfigs = resultData?.all_model_configs;
                const cartData = resultData;
                const statisticalData = resultData?.statistical_analysis;
                const convergingFeatures = resultData?.converging_features;
                const parsimoniousModelConfigs =
                  resultData?.parsimonious_model_configs;
                const convergenceTableData = resultData?.convergence_table;

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
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(resultKey);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 font-mono text-sm">
                            {datasetFilename}
                          </h4>
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          {targetColumn && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium text-gray-600">
                                Target:
                              </span>{' '}
                              <span className="font-mono">{targetColumn}</span>
                            </p>
                          )}
                          {excludeColumns.length > 0 && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium text-gray-600">
                                Excluded:
                              </span>{' '}
                              <span className="font-mono">
                                {excludeColumns.join(', ')}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {result.createdAt.toLocaleDateString()}{' '}
                            {result.createdAt.toLocaleTimeString()}
                          </div>
                          {trainingDuration && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              Runtime: {trainingDuration}
                            </div>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
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
                            {/* Feature Convergence Table */}
                            <ConvergenceTableSection
                              data={convergenceTableData}
                            />
                            {/* CART Surrogate Analysis */}
                            <CARTAnalysisSection
                              graphSvgUrl={cartData?.graph_svg_url}
                              analysisReportUrl={cartData?.analysis_report_url}
                            />
                            {/* Statistical Analysis */}
                            <StatisticalAnalysisSection
                              data={statisticalData}
                            />
                            {/* TreeSHAP Feature Importance */}
                            <ShapImportanceSection
                              modelConfigs={modelConfigs}
                            />
                            {/* Parsimonious Re-run */}
                            <ParsimoniousResultsSection
                              convergingFeatures={convergingFeatures}
                              parsimoniousModelConfigs={
                                parsimoniousModelConfigs
                              }
                            />
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
            {resultsQuery.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resultsQuery.fetchNextPage()}
                  disabled={resultsQuery.isFetchingNextPage}
                >
                  {resultsQuery.isFetchingNextPage
                    ? 'Loading...'
                    : `Load more (${Math.max(0, totalCount - results.length)} remaining)`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
