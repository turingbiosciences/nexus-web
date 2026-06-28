'use client';

import { useState, useMemo } from 'react';
import { ModelParametersModal } from './model-parameters-modal';
import { ModelConfig } from '@/types/model-config';

interface ModelPerformanceTableProps {
  modelConfigs: Record<string, ModelConfig>;
}

const getRocAuc = (config: ModelConfig): number | undefined => {
  return (
    config.best_config_metrics?.roc_auc ??
    config.test_metrics?.roc_auc ??
    config.metrics?.roc_auc ??
    (config.best_config
      ? config.configs?.[config.best_config]?.roc_auc
      : undefined)
  );
};

const getModelParameters = (
  config: ModelConfig
): Record<string, unknown> | null => {
  return (
    (config.best_config_metrics?.params as Record<string, unknown>) ??
    (config.best_config_metrics?.model_parameters as Record<string, unknown>) ??
    (config.best_config &&
      config.configs?.[config.best_config]?.model_parameters) ??
    config.params ??
    null
  );
};

export function ModelPerformanceTable({
  modelConfigs,
}: ModelPerformanceTableProps) {
  const [selectedModel, setSelectedModel] = useState<{
    name: string;
    config: string;
    parameters: Record<string, unknown>;
  } | null>(null);

  const tableData = useMemo(() => {
    return Object.entries(modelConfigs)
      .map(([modelName, config]) => ({
        modelName,
        config,
        rocAuc: getRocAuc(config),
      }))
      .filter(
        (item): item is typeof item & { rocAuc: number } =>
          item.rocAuc !== undefined
      )
      .sort((a, b) => b.rocAuc - a.rocAuc)
      .slice(0, 10)
      .map(({ modelName, config, rocAuc }) => {
        const formattedModelName = modelName
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const modelParameters = getModelParameters(config);

        return {
          modelName,
          formattedModelName,
          rocAuc,
          bestConfig:
            config.best_config || (config.params ? 'Optimized' : 'N/A'),
          modelParameters,
        };
      });
  }, [modelConfigs]);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Model Performance (AUROC)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">
                Model
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">
                AUROC Score
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">
                Best Configuration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr
                key={row.modelName}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-1.5 text-sm text-gray-900">
                  {row.formattedModelName}
                </td>
                <td className="px-4 py-1.5 text-sm">
                  <span
                    className={
                      row.rocAuc >= 0.9
                        ? 'text-green-700 font-semibold'
                        : row.rocAuc >= 0.8
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-700'
                    }
                  >
                    {Number(row.rocAuc).toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-sm">
                  {row.modelParameters ? (
                    <button
                      onClick={() =>
                        setSelectedModel({
                          name: row.formattedModelName,
                          config: row.bestConfig,
                          parameters: row.modelParameters!,
                        })
                      }
                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Click to view hyperparameters"
                    >
                      {row.bestConfig}
                    </button>
                  ) : (
                    <span className="font-mono text-gray-600">
                      {row.bestConfig}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedModel && (
        <ModelParametersModal
          isOpen={!!selectedModel}
          onClose={() => setSelectedModel(null)}
          modelName={selectedModel.name}
          bestConfig={selectedModel.config}
          parameters={selectedModel.parameters}
        />
      )}
    </div>
  );
}
