/**
 * Shared type definitions for model configuration data.
 * This eliminates duplicate ModelConfig interfaces across components.
 */

/**
 * Metrics related to model performance
 */
export interface ModelMetrics {
  roc?: number;
  roc_auc?: number;
  accuracy?: number;
  [key: string]: unknown;
}

/**
 * Configuration data for a single model configuration variant
 */
export interface ModelConfigData extends ModelMetrics {
  model_parameters?: Record<string, unknown>;
}

/**
 * Complete model configuration including test metrics and feature importance
 *
 * This supports two structures:
 * 1. Nested: best_config + best_config_metrics + configs (Legacy/Detailed)
 * 2. Flattened: params + metrics (Simplified/API Response)
 *
 * Precedence for metrics: best_config_metrics -> test_metrics -> metrics
 * Precedence for params: best_config_metrics.model_parameters -> params
 */
export interface ModelConfig {
  // Nested structure (Legacy)
  best_config?: string;
  best_config_metrics?: ModelConfigData;
  test_metrics?: ModelMetrics;
  configs?: Record<string, ModelConfigData>;

  // Flattened structure (API Response)
  params?: Record<string, unknown>;
  metrics?: ModelMetrics;

  feature_importance?: unknown;
  shap_importance?: Record<string, number> | null;
}

/**
 * Type for a collection of model configurations keyed by model name
 */
export type ModelConfigsMap = Record<string, ModelConfig>;
