'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  parseFeatureImportance,
  findElbowPoint,
  FeatureImportanceData,
} from '@/lib/utils/parse-feature-importance';
import {
  CHART_COLORS,
  formatTooltipValue,
  getChartColor,
} from '@/lib/chart-config';
import { ModelConfig } from '@/types/model-config';

interface ModelFeatureImportanceChartsProps {
  modelConfigs: Record<string, ModelConfig>;
}

interface ChartFeature {
  rank: number;
  importance: number;
  feature: string;
}

export function ModelFeatureImportanceCharts({
  modelConfigs,
}: ModelFeatureImportanceChartsProps) {
  // Parse feature importance data for each model
  const modelCharts: Array<{
    modelName: string;
    data: ChartFeature[];
  }> = [];

  Object.entries(modelConfigs).forEach(([modelName, config]) => {
    if (!config.feature_importance) return;

    // Use shared parsing utility
    const parsedFeatures = parseFeatureImportance(config.feature_importance);

    // Convert to chart format with ranks
    const features: ChartFeature[] = parsedFeatures.map((f, index) => ({
      rank: index + 1,
      importance: f.importance,
      feature: f.name,
    }));

    if (features.length > 0) {
      modelCharts.push({
        modelName,
        data: features,
      });
    }
  });

  if (modelCharts.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-6">
      <div>
        <h4 className="font-semibold text-gray-900">
          Feature Importance by Rank
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Feature importance declining from highest to lowest rank for each
          model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelCharts.map((chart, index) => {
          // Convert to format expected by findElbowPoint
          const featuresForElbow: FeatureImportanceData[] = chart.data.map(
            (d) => ({
              name: d.feature,
              importance: d.importance,
            })
          );
          const topN = findElbowPoint(featuresForElbow);
          const topFeatures = chart.data.slice(0, topN);

          return (
            <div key={chart.modelName} className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">
                {chart.modelName.replace(/_/g, ' ')}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Best config:{' '}
                  <span className="font-mono">
                    {modelConfigs[chart.modelName]?.best_config ?? 'N/A'}
                  </span>
                  )
                </span>
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chart.data}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="rank"
                    label={{
                      value: 'Rank',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: 'Importance',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(
                      value: number | string | Array<number | string>
                    ) => formatTooltipValue(Number(value))}
                    labelFormatter={(
                      label: number | string | Array<number | string>
                    ) => `Rank ${label}`}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartFeature;
                        return (
                          <div className="bg-white border border-gray-200 rounded p-2 shadow-sm">
                            <p className="text-xs font-medium text-gray-900">
                              {data.feature}
                            </p>
                            <p className="text-xs text-gray-600">
                              Rank: {data.rank}
                            </p>
                            <p className="text-xs text-gray-600">
                              Importance: {formatTooltipValue(data.importance)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="importance"
                    stroke={getChartColor(CHART_COLORS.multiModel, index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Top Features List */}
              <div className="bg-gray-50 rounded p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Top {topN} Features (by elbow method):
                </p>
                {topFeatures.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-700">
                      {featureIndex + 1}. {feature.feature.trim()}
                    </span>
                    <span className="font-mono text-gray-600">
                      {formatTooltipValue(feature.importance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
