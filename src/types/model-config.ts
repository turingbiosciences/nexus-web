/**
 * Shared type definitions for model configuration data.
 * This eliminates duplicate ModelConfig interfaces across components.
 */

/**
 * Configuration data for a single model configuration variant
 */
export interface ModelConfigData {
  roc?: number;
  roc_auc?: number;
  model_parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Complete model configuration including test metrics and feature importance
 */
export interface ModelConfig {
  best_config?: string;
  best_config_metrics?: ModelConfigData;
  test_metrics?: {
    roc?: number;
    roc_auc?: number;
    [key: string]: unknown;
  };
  // Support for flattened structure
  params?: Record<string, unknown>;
  metrics?: {
    roc?: number;
    roc_auc?: number;
    accuracy?: number;
    [key: string]: unknown;
  };
  feature_importance?: unknown;
  configs?: Record<string, ModelConfigData>;
}

/**
 * Type for a collection of model configurations keyed by model name
 */
export type ModelConfigsMap = Record<string, ModelConfig>;
