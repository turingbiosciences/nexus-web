'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  formatTooltipValue,
  getChartColor,
} from '@/lib/chart-config';

interface FeatureComparisonChartProps {
  data: Record<string, unknown>;
}

export function FeatureComparisonChart({ data }: FeatureComparisonChartProps) {
  // Transform the data for Recharts
  // We take the top 20 features from each model and combine them
  // This avoids plotting 1000+ points which is unreadable
  const TOP_N_PER_MODEL = 20;
  let chartData: Array<Record<string, string | number>> = [];
  let modelNames: string[] = [];

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);

    if (entries.length > 0) {
      // 1. Map features to models
      const modelToFeatures: Record<
        string,
        Array<{ name: string; importance: number }>
      > = {};

      entries.forEach(([featureName, modelMap]) => {
        if (typeof modelMap === 'object' && modelMap !== null) {
          Object.entries(modelMap as Record<string, number>).forEach(
            ([modelName, importance]) => {
              if (!modelToFeatures[modelName]) modelToFeatures[modelName] = [];
              if (typeof importance === 'number') {
                modelToFeatures[modelName].push({
                  name: featureName,
                  importance,
                });
              }
            }
          );
        }
      });

      // 2. Identify "Significant Features" (union of top N from each model)
      const significantFeatureSet = new Set<string>();
      modelNames = Object.keys(modelToFeatures);

      modelNames.forEach((modelName) => {
        modelToFeatures[modelName]
          .sort((a, b) => b.importance - a.importance)
          .slice(0, TOP_N_PER_MODEL)
          .forEach((f) => significantFeatureSet.add(f.name));
      });

      // 3. Build chart data for significant features, filling missing with 0
      chartData = Array.from(significantFeatureSet).map((featureName) => {
        const point: Record<string, string | number> = { name: featureName };
        const modelMap = data[featureName] as Record<string, number>;

        modelNames.forEach((modelName) => {
          // Explicitly set to 0 if missing as requested
          point[modelName] = modelMap?.[modelName] ?? 0;
        });
        return point;
      });

      // 4. Sort alphabetically or by max importance for better visualization
      // Sorting by max importance usually makes the chart easier to read
      chartData.sort((a, b) => {
        const maxA = Math.max(...modelNames.map((m) => (a[m] as number) || 0));
        const maxB = Math.max(...modelNames.map((m) => (b[m] as number) || 0));
        return maxB - maxA;
      });
    }
  } else if (Array.isArray(data)) {
    // Fallback for array data if provided
    chartData = data as Array<Record<string, string | number>>;
    modelNames = Array.from(
      new Set(
        chartData.flatMap((item) =>
          Object.keys(item).filter((key) => key !== 'index' && key !== 'name')
        )
      )
    );
  }

  if (chartData.length === 0 || modelNames.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-semibold text-gray-900 mb-2">Feature Comparison</h4>
        <p className="text-sm text-gray-500">
          No feature comparison data available
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h4 className="font-semibold text-gray-900 mb-2">
        Feature Comparison Across Models
      </h4>
      <p className="text-xs text-gray-500 mb-4">
        Showing the union of the top {TOP_N_PER_MODEL} features from each
        algorithm. Values are normalized (0–100). Features not ranked by an
        algorithm are shown as 0.
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            label={{ value: 'Features', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => formatTooltipValue(value)}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ paddingTop: '5px' }} />
          {modelNames.map((modelName, index) => (
            <Line
              key={modelName}
              type="monotone"
              dataKey={modelName}
              stroke={getChartColor(CHART_COLORS.multiModel, index)}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={modelName.replace(/_/g, ' ')}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Data Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-3 font-semibold text-gray-700">Feature</th>
              {modelNames.map((modelName) => (
                <th
                  key={modelName}
                  className="py-2 px-3 font-semibold text-gray-700 text-right"
                >
                  {modelName.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr
                key={row.name as string}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="py-1.5 px-3 font-medium text-gray-900 border-b border-gray-100">
                  {row.name as string}
                </td>
                {modelNames.map((modelName) => (
                  <td
                    key={modelName}
                    className="py-1.5 px-3 text-right text-gray-600 border-b border-gray-100 font-mono"
                  >
                    {((row[modelName] as number | undefined) ?? 0).toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
