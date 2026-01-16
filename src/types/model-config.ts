/**
 * Shared type definitions for model configuration data.
 * This eliminates duplicate ModelConfig interfaces across components.
 */

/**
 * Configuration data for a single model configuration variant
 */
export interface ModelConfigData {
    roc?: number;
    model_parameters?: Record<string, unknown>;
    [key: string]: unknown;
}

/**
 * Complete model configuration including test metrics and feature importance
 */
export interface ModelConfig {
    best_config?: string;
    test_metrics?: {
        roc?: number;
        [key: string]: unknown;
    };
    feature_importance?: unknown;
    configs?: Record<string, ModelConfigData>;
}

/**
 * Type for a collection of model configurations keyed by model name
 */
export type ModelConfigsMap = Record<string, ModelConfig>;
