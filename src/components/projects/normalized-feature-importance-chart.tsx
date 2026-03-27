'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { parseFeatureImportanceByModel } from '@/lib/utils/parse-feature-importance';
import {
  CHART_COLORS,
  formatTooltipValue,
  getChartColor,
} from '@/lib/chart-config';

interface NormalizedFeatureImportanceChartProps {
  data: Record<string, unknown>;
}

export function NormalizedFeatureImportanceChart({
  data,
}: NormalizedFeatureImportanceChartProps) {
  // Parse using shared utility, memoized to prevent O(N log N) recalculation on render
  const modelCharts = useMemo(
    () => parseFeatureImportanceByModel(data, 10),
    [data]
  );

  if (modelCharts.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-semibold text-gray-900 mb-2">
          Normalized Feature Importance by Model
        </h4>
        <p className="text-sm text-gray-500">
          No normalized feature importance data available
        </p>
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">
            Debug: View raw data
          </summary>
          <pre className="text-xs bg-gray-50 p-2 mt-2 overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-6">
      <div>
        <h4 className="font-semibold text-gray-900">
          Normalized Feature Importance by Model
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Top 10 features for each of {modelCharts.length} models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelCharts.map((modelChart, modelIndex) => (
          <div key={modelChart.modelName} className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">
              {modelChart.modelName.replace(/_/g, ' ')}
            </h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={modelChart.features.map((f) => ({
                  feature: f.name,
                  normalized_importance: f.normalizedImportance ?? f.importance,
                }))}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipValue(value, 2)}
                  labelStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="normalized_importance"
                  name="Importance"
                  fill={getChartColor(
                    CHART_COLORS.blueGradientReverse,
                    modelIndex
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
