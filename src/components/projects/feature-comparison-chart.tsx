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
  // Expected format: array of data points with x-axis value and model values
  let chartData: Array<Record<string, string | number>> = [];

  // Try to detect data structure and transform accordingly
  if (Array.isArray(data)) {
    chartData = data as Array<Record<string, string | number>>;
  } else if (typeof data === 'object' && data !== null) {
    // If it's an object, try to convert to array format
    // Handle different possible structures
    const entries = Object.entries(data);

    if (entries.length > 0) {
      const firstValue = entries[0][1];

      if (Array.isArray(firstValue)) {
        // Structure: { model1: [values], model2: [values] }
        const maxLength = Math.max(
          ...entries.map(([, values]) =>
            Array.isArray(values) ? values.length : 0
          )
        );

        chartData = Array.from({ length: maxLength }, (_, index) => {
          const point: Record<string, string | number> = { index: index + 1 };
          entries.forEach(([modelName, values]) => {
            if (Array.isArray(values) && typeof values[index] === 'number') {
              point[modelName] = values[index];
            }
          });
          return point;
        });
      } else if (typeof firstValue === 'object' && firstValue !== null) {
        // Structure: nested objects, convert to array
        chartData = entries.map(([key, value]) => ({
          name: key,
          ...(typeof value === 'object' && value !== null
            ? (value as Record<string, unknown>)
            : {}),
        })) as Array<Record<string, string | number>>;
      }
    }
  }

  // Get all model names (keys except 'index' or 'name')
  const modelNames = Array.from(
    new Set(
      chartData.flatMap((item) =>
        Object.keys(item).filter((key) => key !== 'index' && key !== 'name')
      )
    )
  );

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
      <h4 className="font-semibold text-gray-900 mb-4">
        Feature Comparison Across Models
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Comparing feature performance across different models
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
    </div>
  );
}
