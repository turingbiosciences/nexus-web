'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  parseFeatureImportance,
  FeatureImportanceData,
} from '@/lib/utils/parse-feature-importance';
import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  formatTooltipValue,
  getChartColor,
} from '@/lib/chart-config';

interface FeatureImportanceChartProps {
  modelName: string;
  bestConfig: string;
  featureImportance: FeatureImportanceData[] | Record<string, number>;
}

export function FeatureImportanceChart({
  modelName,
  bestConfig,
  featureImportance,
}: FeatureImportanceChartProps) {
  // Parse feature importance data using shared utility
  const features = parseFeatureImportance(featureImportance);

  if (features.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 capitalize">
            {modelName.replace(/_/g, ' ')}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Best config: <span className="font-mono text-xs">{bestConfig}</span>
          </p>
        </div>
        <p className="text-sm text-gray-500">
          No feature importance data available
        </p>
      </div>
    );
  }

  // Limit to top 10 features for readability (already sorted by parseFeatureImportance)
  const topFeatures = features.slice(0, 10);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 capitalize">
          {modelName.replace(/_/g, ' ')}
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          Best config: <span className="font-mono text-xs">{bestConfig}</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={topFeatures}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatTooltipValue(value)}
            labelStyle={{ color: '#374151' }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {topFeatures.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getChartColor(CHART_COLORS.blueGradient, index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
