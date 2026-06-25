'use client';

import { FeatureImportanceChart } from './feature-importance-chart';
import { ModelConfig } from '@/types/model-config';

import { Info } from 'lucide-react';

interface FeatureImportanceSectionProps {
  modelConfigs: Record<string, ModelConfig>;
}

export function FeatureImportanceSection({
  modelConfigs,
}: FeatureImportanceSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-0">
          Feature Importance by Model
        </h3>
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
            <p className="font-bold mb-1">Score Normalization</p>
            <p className="opacity-90 leading-relaxed">
              Different algorithms use unique internal measures for feature
              importance. All scores have been normalized to a 0–100 scale for
              direct visual comparison across models.
            </p>
            <div className="absolute left-1.5 -bottom-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(modelConfigs).map(([modelName, modelConfig]) => {
          const bestConfigName =
            modelConfig.best_config ||
            (modelConfig.params ? 'Optimized' : 'N/A');

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
