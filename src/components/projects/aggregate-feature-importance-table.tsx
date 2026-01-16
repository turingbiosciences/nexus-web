"use client";

interface TopFeature {
  feature: string;
  mean_importance: number;
  sum_importance: number;
  max_importance: number;
  min_importance: number;
  std_importance: number;
  weighted_score: number;
  num_models: number;
  models: string[];
}

interface AggregateFeatureImportanceTableProps {
  data: {
    top_features: TopFeature[];
  };
}

export function AggregateFeatureImportanceTable({
  data,
}: AggregateFeatureImportanceTableProps) {
  const { top_features } = data;

  if (!top_features || top_features.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-semibold text-gray-900 mb-2">
          Aggregate Feature Importance
        </h4>
        <p className="text-sm text-gray-500">
          No aggregate feature importance data available
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900">
          Aggregate Feature Importance
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Top {top_features.length} features ranked by weighted score across all
          models
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Rank
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Feature
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">
                Weighted Score
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">
                Mean Importance
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">
                Max Importance
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">
                Min Importance
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">
                Std Dev
              </th>
              <th className="text-center py-2 px-3 font-semibold text-gray-700">
                # Models
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Models
              </th>
            </tr>
          </thead>
          <tbody>
            {top_features.map((feature, index) => (
              <tr
                key={feature.feature}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                <td className="py-2 px-3 font-medium text-gray-900">
                  {feature.feature.trim()}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-gray-900">
                  {feature.weighted_score.toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {feature.mean_importance.toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {feature.max_importance.toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {feature.min_importance.toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {feature.std_importance.toFixed(4)}
                </td>
                <td className="py-2 px-3 text-center text-gray-700">
                  {feature.num_models}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {feature.models.map((model) => (
                      <span
                        key={model}
                        className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
