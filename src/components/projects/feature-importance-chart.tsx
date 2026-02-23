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
import { Info } from 'lucide-react';
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

const ALGORITHM_MEASURES: Record<
  string,
  { label: string; description: string }
> = {
  random_forest: {
    label: 'Gini Importance (MDI)',
    description:
      'Measures the total reduction of "impurity" (Gini criterion) brought by a feature across all trees.',
  },
  xgboost: {
    label: 'Weight (Frequency)',
    description:
      'The number of times a feature is used to split the data across all trees.',
  },
  lightgbm: {
    label: 'Split Count',
    description:
      'Counts the raw number of times a feature was used for a split.',
  },
  catboost: {
    label: 'PredictionValuesChange',
    description:
      'Measures how much on average the prediction changes when the feature value changes.',
  },
};

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
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 capitalize">
            {modelName.replace(/_/g, ' ')}
          </h4>
          {(() => {
            const measure = ALGORITHM_MEASURES[modelName.toLowerCase()];
            if (!measure) return null;
            return (
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
                  <p className="font-bold mb-1">{measure.label}</p>
                  <p className="opacity-90 leading-relaxed">
                    {measure.description}
                  </p>
                  <div className="absolute left-1.5 -bottom-1 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            );
          })()}
        </div>
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
            formatter={(value: number | string | Array<number | string>) =>
              formatTooltipValue(Number(value))
            }
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
