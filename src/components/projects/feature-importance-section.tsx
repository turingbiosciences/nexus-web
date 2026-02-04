'use client';

import { FeatureImportanceChart } from './feature-importance-chart';
import { ModelConfig } from '@/types/model-config';

interface FeatureImportanceSectionProps {
  modelConfigs: Record<string, ModelConfig>;
}

export function FeatureImportanceSection({
  modelConfigs,
}: FeatureImportanceSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Feature Importance by Model
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(modelConfigs).map(([modelName, modelConfig]) => {
          const bestConfigName = modelConfig.best_config || 'N/A';

          // Extract feature importance from the model level (not config level)
          const featureImportance = modelConfig.feature_importance as
            | Array<{ name: string; importance: number }>
            | Record<string, number>
            | undefined;

          if (
            !featureImportance ||
            (typeof featureImportance === 'object' &&
              Object.keys(featureImportance).length === 0)
          ) {
            return null;
          }

          return (
            <FeatureImportanceChart
              key={modelName}
              modelName={modelName}
              bestConfig={bestConfigName}
              featureImportance={featureImportance}
            />
          );
        })}
      </div>
    </div>
  );
}
