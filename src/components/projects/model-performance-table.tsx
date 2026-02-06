'use client';

import { useState, useMemo } from 'react';
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

  // Memoize the expensive data transformation separately from rendering
  const tableData = useMemo(() => {
    return Object.entries(modelConfigs)
      .filter(([, config]) => {
        const hasRoc =
          config.best_config_metrics?.roc !== undefined ||
          config.test_metrics?.roc !== undefined ||
          (config.best_config &&
            config.configs?.[config.best_config]?.roc !== undefined);
        return hasRoc;
      })
      .sort(([, a], [, b]) => {
        const rocA =
          a.best_config_metrics?.roc ??
          a.test_metrics?.roc ??
          (a.best_config && a.configs?.[a.best_config]?.roc) ??
          0;
        const rocB =
          b.best_config_metrics?.roc ??
          b.test_metrics?.roc ??
          (b.best_config && b.configs?.[b.best_config]?.roc) ??
          0;
        return Number(rocB) - Number(rocA);
      })
      .slice(0, 10)
      .map(([modelName, config]) => {
        const rocValue =
          config.best_config_metrics?.roc ??
          config.test_metrics?.roc ??
          (config.best_config && config.configs?.[config.best_config]?.roc);

        const auroc = Number(rocValue) || 0;
        const formattedModelName = modelName
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Get model parameters from the best config or metrics
        let modelParameters: Record<string, unknown> | null =
          (config.best_config_metrics?.params as Record<string, unknown>) ||
          (config.best_config_metrics?.model_parameters as Record<
            string,
            unknown
          >) ||
          null;

        if (!modelParameters && config.best_config && config.configs) {
          const bestConfigData = config.configs[config.best_config];
          if (bestConfigData?.model_parameters) {
            modelParameters = bestConfigData.model_parameters;
          }
        }

        return {
          modelName,
          formattedModelName,
          auroc,
          bestConfig: config.best_config || 'N/A',
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
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 border-b"></th>
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
                      row.auroc >= 0.9
                        ? 'text-green-700 font-semibold'
                        : row.auroc >= 0.8
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-700'
                    }
                  >
                    {Number(row.auroc).toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-sm text-gray-600 font-mono">
                  {row.bestConfig}
                </td>
                <td className="px-4 py-1.5 text-center">
                  {row.modelParameters && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        setSelectedModel({
                          name: row.formattedModelName,
                          config: row.bestConfig,
                          parameters: row.modelParameters,
                        })
                      }
                    >
                      Details
                    </Button>
                  )}
                </td>
              </tr>
            ))}
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
