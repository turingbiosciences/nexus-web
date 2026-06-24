/**
 * Utility for parsing feature importance data from various formats.
 * Consolidates the duplicated parsing logic from multiple chart components.
 */

/**
 * Standardized feature importance data structure
 */
export interface FeatureImportanceData {
  name: string;
  importance: number;
  normalizedImportance?: number;
}

/**
 * Raw rank data structure from API
 */
interface RankData {
  feature?: string;
  name?: string;
  importance?: number;
  normalized_importance?: number;
  rank?: number;
  [key: string]: unknown;
}

/**
 * Parse feature importance data from various input formats.
 * Handles:
 * - Array format: [{ name, importance }, ...]
 * - Rank structure: { rank_1: {...}, rank_2: {...}, ... }
 * - Key-value pairs: { feature_name: importance_value, ... }
 *
 * @param data Raw feature importance data in any supported format
 * @returns Standardized array of feature importance data, sorted by importance (descending)
 */
export function parseFeatureImportance(
  data: FeatureImportanceData[] | Record<string, unknown> | unknown
): FeatureImportanceData[] {
  let features: FeatureImportanceData[] = [];

  if (!data) {
    return features;
  }

  if (Array.isArray(data)) {
    // Already an array - map to standardized format
    features = data
      .map((item, index) => {
        if (typeof item === 'number') {
          return {
            name: `Feature ${index + 1}`,
            importance: item,
          };
        }
        return {
          name: item.feature || item.name || `Feature ${index + 1}`,
          importance: typeof item.importance === 'number' ? item.importance : 0,
          normalizedImportance:
            typeof item.normalized_importance === 'number'
              ? item.normalized_importance
              : undefined,
        };
      })
      .filter((f) => f && f.name && typeof f.importance === 'number');
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data as Record<string, unknown>);

    // Check if it's a rank structure (rank_1, rank_2, etc.)
    const hasRankKeys = entries.some(([key]) => key.startsWith('rank_'));

    if (hasRankKeys) {
      // Extract from rank structure, sorted by rank number
      features = entries
        .filter(([key]) => key.startsWith('rank_'))
        .sort((a, b) => {
          const rankA = parseInt(a[0].replace('rank_', ''));
          const rankB = parseInt(b[0].replace('rank_', ''));
          return rankA - rankB;
        })
        .map(([, value]) => {
          const rankData = value as RankData;
          return {
            name: (rankData.feature || rankData.name || '').trim(),
            importance:
              typeof rankData.importance === 'number' ? rankData.importance : 0,
            normalizedImportance:
              typeof rankData.normalized_importance === 'number'
                ? rankData.normalized_importance
                : undefined,
          };
        })
        .filter((f) => f.name);
    } else {
      // Treat as simple key-value pairs: { feature_name: importance }
      features = entries
        .map(([name, importance]) => ({
          name,
          importance: typeof importance === 'number' ? importance : 0,
        }))
        .filter((f) => typeof f.importance === 'number');
    }
  }

  // Sort by importance (descending)
  return features.sort((a, b) => b.importance - a.importance);
}

/**
 * Parse feature importance data grouped by model.
 * Used for charts that display multiple models' feature importance.
 *
 * @param data Object with model names as keys and feature importance data as values
 * @param limit Maximum number of features to return per model
 * @returns Array of parsed model data
 */
export function parseFeatureImportanceByModel(
  data: Record<string, unknown>,
  limit: number = 10
): Array<{
  modelName: string;
  features: FeatureImportanceData[];
}> {
  const modelCharts: Array<{
    modelName: string;
    features: FeatureImportanceData[];
  }> = [];

  if (!data || typeof data !== 'object') {
    return modelCharts;
  }

  Object.entries(data).forEach(([modelName, modelData]) => {
    const features = parseFeatureImportance(modelData);

    if (features.length > 0) {
      modelCharts.push({
        modelName,
        features: features.slice(0, limit),
      });
    }
  });

  return modelCharts;
}

/**
 * Find the elbow point in feature importance data using the kneedle algorithm.
 * Computes the perpendicular distance from each point to the reference line
 * connecting (rank=0, importance=max) to (rank=n-1, importance=min) in
 * normalized space. The point with maximum distance is the knee.
 *
 * @param features Sorted feature importance data (descending by importance)
 * @param maxFeatures Maximum features to return (default 50)
 * @returns Optimal number of features to display (at least 5, at most maxFeatures)
 */
export function findElbowPoint(
  features: FeatureImportanceData[],
  maxFeatures: number = 50
): number {
  const n = Math.min(features.length, maxFeatures);
  if (n < 3) {
    return Math.min(n, 5);
  }

  const values = features.slice(0, n).map((f) => f.importance);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;

  // All features have the same importance — no meaningful elbow.
  if (range === 0) {
    return Math.min(5, n);
  }

  // Kneedle: find max perpendicular distance from the line (0,1)→(1,0)
  // in normalized [rank, importance] space.
  // Line equation: x + y = 1  →  distance ∝ |1 - x - y|
  let maxDist = -Infinity;
  let elbowIndex = 0;
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const y = (values[i] - minVal) / range;
    const dist = Math.abs(1 - x - y);
    if (dist > maxDist) {
      maxDist = dist;
      elbowIndex = i;
    }
  }

  // elbowIndex is 0-based; convert to 1-based count, minimum 5.
  return Math.max(5, Math.min(elbowIndex + 1, maxFeatures));
}
