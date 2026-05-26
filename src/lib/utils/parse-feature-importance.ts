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
    const dataObj = data as Record<string, unknown>;

    // Check if it's a rank structure by examining the first few keys
    let isRankStructure = false;
    for (const key in dataObj) {
      if (key.startsWith('rank_')) {
        isRankStructure = true;
        break;
      }
    }

    if (isRankStructure) {
      const parsedFeatures: (FeatureImportanceData & { _rank: number })[] = [];

      for (const key in dataObj) {
        if (key.startsWith('rank_')) {
          const rankData = dataObj[key] as RankData;
          const name = (rankData.feature || rankData.name || '').trim();

          if (name) {
            parsedFeatures.push({
              name,
              importance:
                typeof rankData.importance === 'number'
                  ? rankData.importance
                  : 0,
              normalizedImportance:
                typeof rankData.normalized_importance === 'number'
                  ? rankData.normalized_importance
                  : undefined,
              _rank: parseInt(key.slice(5), 10),
            });
          }
        }
      }

      // The original code did:
      // 1. sort by rank (a.rank - b.rank)
      // 2. map over elements
      // 3. filter by name
      // 4. sort by importance (descending)
      //
      // Because sort in JS is stable, sorting by rank first meant that when
      // elements have the same importance, their original rank order is preserved.
      // So we must sort by importance first, and fallback to rank if importance is tied.
      features = parsedFeatures
        .sort((a, b) => {
          if (a.importance !== b.importance) {
            return b.importance - a.importance;
          }
          return a._rank - b._rank;
        })
        .map(({ _rank, ...rest }) => rest);

      return features;
    } else {
      // Treat as simple key-value pairs: { feature_name: importance }
      for (const name in dataObj) {
        if (Object.prototype.hasOwnProperty.call(dataObj, name)) {
          const importance = dataObj[name];
          features.push({
            name,
            importance: typeof importance === 'number' ? importance : 0,
          });
        }
      }

      // We must explicitly filter out items where importance evaluation previously resulted in typeof checking to ensure only valid items made it through,
      // but original code was `.map(([name, imp]) => ({ name, importance: typeof imp === 'number' ? imp : 0 })).filter(f => typeof f.importance === 'number')`
      // Wait, original code coerced to 0, then filtered for typeof === 'number'. Since 0 is a number, it always passes the filter!
      // Therefore no items are dropped.
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
 * Find the elbow point in feature importance data using rate of change in slope.
 * This helps determine the optimal number of top features to display.
 *
 * @param features Sorted feature importance data (descending by importance)
 * @returns Optimal number of features to display (between 3 and 10)
 */
export function findElbowPoint(features: FeatureImportanceData[]): number {
  if (features.length < 3) {
    return Math.min(features.length, 5);
  }

  // Calculate second derivative (rate of change of slope)
  const secondDerivatives: number[] = [];
  for (let i = 1; i < features.length - 1; i++) {
    const slope1 = features[i].importance - features[i - 1].importance;
    const slope2 = features[i + 1].importance - features[i].importance;
    const secondDeriv = Math.abs(slope2 - slope1);
    secondDerivatives.push(secondDeriv);
  }

  // Find the maximum change in slope (elbow point)
  let maxChange = 0;
  let elbowIndex = 0;
  for (let i = 0; i < secondDerivatives.length; i++) {
    if (secondDerivatives[i] > maxChange) {
      maxChange = secondDerivatives[i];
      elbowIndex = i + 1; // Adjust for offset
    }
  }

  // Ensure we show at least 3 and at most 10 features
  return Math.max(3, Math.min(elbowIndex + 2, 10));
}
