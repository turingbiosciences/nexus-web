'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModelParametersModal } from './model-parameters-modal';
import { ModelConfig } from '@/types/model-config';

interface ModelPerformanceTableProps {
  modelConfigs: Record<string, ModelConfig>;
}

export function ModelPerformanceTable({
  modelConfigs,
}: ModelPerformanceTableProps) {
  const [selectedModel, setSelectedModel] = useState<{
    name: string;
    config: string;
    parameters: Record<string, unknown>;
  } | null>(null);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Model Performance (AUROC)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Model
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                AUROC Score
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Best Configuration
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(modelConfigs)
              .filter(
                ([, config]) =>
                  config.best_config &&
                  config.configs?.[config.best_config]?.roc !== undefined
              )
              .sort(
                ([, a], [, b]) =>
                  ((b.best_config && b.configs?.[b.best_config]?.roc) || 0) -
                  ((a.best_config && a.configs?.[a.best_config]?.roc) || 0)
              )
              .slice(0, 10)
              .map(([modelName, config]) => {
                const rocValue =
                  config.best_config &&
                  config.configs?.[config.best_config]?.roc;
                console.log(`Model: ${modelName}`);
                console.log(`  best_config: ${config.best_config}`);
                console.log(`  Full config object:`, config);
                console.log(
                  `  ROC raw value:`,
                  rocValue,
                  'type:',
                  typeof rocValue
                );
                const auroc = Number(rocValue) || 0;
                const formattedModelName = modelName
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                // Get model parameters from the best config
                let modelParameters: Record<string, unknown> | null = null;
                if (config.best_config && config.configs) {
                  const bestConfigData = config.configs[config.best_config];
                  if (bestConfigData?.model_parameters) {
                    modelParameters = bestConfigData.model_parameters;
                  }
                }

                return (
                  <tr
                    key={modelName}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formattedModelName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          auroc >= 0.9
                            ? 'text-green-700 font-semibold'
                            : auroc >= 0.8
                              ? 'text-blue-700 font-medium'
                              : 'text-gray-700'
                        }
                      >
                        {Number(auroc).toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {config.best_config || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {modelParameters && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedModel({
                              name: formattedModelName,
                              config: config.best_config || 'N/A',
                              parameters: modelParameters,
                            })
                          }
                        >
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Model Parameters Modal */}
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
