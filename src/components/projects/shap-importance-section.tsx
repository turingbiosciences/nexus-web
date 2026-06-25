'use client';

import { useMemo } from 'react';
import { ModelConfig } from '@/types/model-config';
import { Info } from 'lucide-react';

interface ShapImportanceSectionProps {
  modelConfigs: Record<string, ModelConfig>;
}

const MAX_FEATURES = 20;

const MODEL_COLORS: Record<string, string> = {
  catboost: '#2563eb',
  xgboost: '#7c3aed',
  lightgbm: '#059669',
  random_forest: '#d97706',
  linear_boost: '#db2777',
};

function getModelColor(modelName: string): string {
  return MODEL_COLORS[modelName.toLowerCase()] ?? '#64748b';
}

function ShapModelChart({
  modelName,
  shapData,
}: {
  modelName: string;
  shapData: Record<string, number>;
}) {
  const sorted = useMemo(() => {
    return Object.entries(shapData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_FEATURES);
  }, [shapData]);

  if (sorted.length === 0) return null;

  const maxVal = sorted[0][1];
  const color = getModelColor(modelName);

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium text-gray-700">
        {modelName.replace(/_/g, ' ')}
      </h5>
      <div className="space-y-1">
        {sorted.map(([feature, value], i) => {
          const barPct =
            maxVal > 0 ? Math.max(0, Math.min(100, (value / maxVal) * 100)) : 0;
          return (
            <div key={feature} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-right text-gray-400 flex-shrink-0">
                {i + 1}
              </span>
              <span
                className="w-40 truncate text-gray-700 font-mono flex-shrink-0"
                title={feature}
              >
                {feature}
              </span>
              <div className="flex-1 bg-gray-100 rounded-sm h-3 overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-16 text-right font-mono text-gray-600 flex-shrink-0">
                {value.toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShapImportanceSection({
  modelConfigs,
}: ShapImportanceSectionProps) {
  const modelsWithShap = useMemo(
    () =>
      Object.entries(modelConfigs).filter(
        ([, cfg]) =>
          cfg.shap_importance && Object.keys(cfg.shap_importance).length > 0
      ),
    [modelConfigs]
  );

  if (modelsWithShap.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-gray-900 mb-0">
          TreeSHAP Feature Importance
        </h4>
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
            <p className="font-bold mb-1">Mean |SHAP| values</p>
            <p className="opacity-90 leading-relaxed">
              TreeSHAP computes exact Shapley values for tree-based models. Each
              bar shows the mean absolute SHAP value across the test set — a
              model-agnostic measure of how much each feature moves the
              prediction from the baseline. Higher = more influential.
            </p>
            <div className="absolute left-1.5 -bottom-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Mean |SHAP| per feature for the best configuration of each model. Top{' '}
        {MAX_FEATURES} shown.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelsWithShap.map(([modelName, cfg]) => (
          <ShapModelChart
            key={modelName}
            modelName={modelName}
            shapData={cfg.shap_importance!}
          />
        ))}
      </div>
    </div>
  );
}
