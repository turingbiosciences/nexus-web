"use client";

interface FeatureImportance {
  name: string;
  importance: number;
}

interface FeatureImportanceChartProps {
  modelName: string;
  bestConfig: string;
  featureImportance: FeatureImportance[] | Record<string, number>;
}

export function FeatureImportanceChart({
  modelName,
  bestConfig,
  featureImportance,
}: FeatureImportanceChartProps) {
  // Convert rank structure to array format if needed
  let features: Array<{ name: string; importance: number }> = [];

  if (Array.isArray(featureImportance)) {
    // Already an array
    features = featureImportance;
  } else if (typeof featureImportance === "object") {
    // Check if it's a rank structure (rank_1, rank_2, etc.)
    if (
      Object.keys(featureImportance).some((key) => key.startsWith("rank_"))
    ) {
      // Extract from rank structure
      const entries = Object.entries(featureImportance) as Array<
        [string, any]
      >;
      features = entries
        .sort((a, b) => {
          const rankA = parseInt(a[0].replace("rank_", ""));
          const rankB = parseInt(b[0].replace("rank_", ""));
          return rankA - rankB;
        })
        .map(([_, data]) => ({
          name: data.feature || data.name || "",
          importance:
            typeof data.importance === "number" ? data.importance : 0,
        }));
    } else {
      // Treat as simple key-value pairs
      features = Object.entries(featureImportance).map(([name, importance]) => ({
        name,
        importance: typeof importance === "number" ? importance : 0,
      }));
    }
  }

  // Filter out invalid entries
  features = features.filter(
    (f) => f && f.name && typeof f.importance === "number"
  );

  if (features.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 capitalize">
            {modelName.replace(/_/g, " ")}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Best config: <span className="font-mono text-xs">{bestConfig}</span>
          </p>
        </div>
        <p className="text-sm text-gray-500">No feature importance data available</p>
      </div>
    );
  }

  // Sort by importance (descending)
  const sortedFeatures = [...features].sort(
    (a, b) => b.importance - a.importance
  );

  // Get max importance for scaling
  const maxImportance = Math.max(
    ...features.map((f) => f.importance)
  );

  // Limit to top 10 features for readability
  const topFeatures = sortedFeatures.slice(0, 10);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 capitalize">
          {modelName.replace(/_/g, " ")}
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          Best config: <span className="font-mono text-xs">{bestConfig}</span>
        </p>
      </div>

      <div className="space-y-2">
        {topFeatures.map((feature, index) => {
          const percentage = maxImportance > 0 ? (feature.importance / maxImportance) * 100 : 0;
          const importanceValue = typeof feature.importance === "number" ? feature.importance : 0;
          
          return (
            <div key={`${feature.name}-${index}`} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium truncate max-w-[70%]">
                  {feature.name.trim()}
                </span>
                <span className="text-gray-600 text-xs font-mono">
                  {importanceValue.toFixed(4)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 group-hover:bg-blue-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
