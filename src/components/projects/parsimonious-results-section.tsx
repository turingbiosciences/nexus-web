'use client';

import { Info } from 'lucide-react';
import { ModelConfig } from '@/types/model-config';

interface ParsimoniousResultsSectionProps {
  convergingFeatures: string[] | null | undefined;
  parsimoniousModelConfigs: Record<string, ModelConfig> | null | undefined;
}

function MetricCell({ value }: { value: unknown }) {
  if (typeof value === 'number' && !isNaN(value)) {
    return <span className="font-mono">{value.toFixed(4)}</span>;
  }
  if (value === null || value === undefined || Number.isNaN(value))
    return <span className="text-gray-400">—</span>;
  return <span>{String(value)}</span>;
}

export function ParsimoniousResultsSection({
  convergingFeatures,
  parsimoniousModelConfigs,
}: ParsimoniousResultsSectionProps) {
  const hasFeatures = convergingFeatures && convergingFeatures.length > 0;
  const hasModels =
    parsimoniousModelConfigs &&
    Object.keys(parsimoniousModelConfigs).length > 0;

  if (!hasFeatures && !hasModels) return null;

  const modelRows =
    parsimoniousModelConfigs && Object.keys(parsimoniousModelConfigs).length > 0
      ? Object.entries(parsimoniousModelConfigs).map(([name, cfg]) => {
          const metrics = cfg?.test_metrics ?? cfg?.metrics ?? {};
          return { name, metrics };
        })
      : [];

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-gray-900 mb-0">
          Parsimonious Re-run
        </h4>
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
            <p className="font-bold mb-1">Addressing the Rashomon Effect</p>
            <p className="opacity-90 leading-relaxed">
              The Rashomon Effect describes many equally-good models using
              different feature combinations. A parsimonious re-run isolates the
              features that converge across all models and retrains using only
              those. High AUROC here confirms a true causal mechanism rather
              than model-specific noise.
            </p>
            <div className="absolute left-1.5 -bottom-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>

      {convergingFeatures && convergingFeatures.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">
            Converging features ({convergingFeatures.length}) used in re-run:
          </p>
          <div className="flex flex-wrap gap-1">
            {convergingFeatures.map((f) => (
              <span
                key={f}
                className="inline-block bg-blue-50 text-blue-800 font-mono text-xs px-2 py-0.5 rounded border border-blue-200"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {modelRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">
            Parsimonious model performance:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">
                    Model
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-600">
                    ROC AUC
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-600">
                    ECE
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-600">
                    Log Loss
                  </th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map(({ name, metrics }) => (
                  <tr key={name} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-800">
                      {name.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <MetricCell value={metrics.roc_auc ?? metrics.roc} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <MetricCell value={metrics.ece} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <MetricCell value={metrics.log_loss ?? metrics.logloss} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
