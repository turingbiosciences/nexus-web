'use client';

import { useMemo, useState } from 'react';
import { ConfusionMatrix, ModelConfig } from '@/types/model-config';
import { Info } from 'lucide-react';

interface ConfusionMatrixSectionProps {
  modelConfigs: Record<string, ModelConfig>;
}

type ViewMode = 'rates' | 'counts';

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

/**
 * Convert a hex model colour into a cell background at the given intensity.
 *
 * The matrix is a table, not a chart, so the shading is the only encoding
 * doing real work: it has to make the diagonal legible at a glance without
 * washing out the off-diagonal cells that are the interesting part.
 */
function cellBackground(hex: string, intensity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Cap the alpha short of 1 so dark text stays readable on the strongest cell.
  const alpha = Math.max(0, Math.min(0.85, intensity * 0.85));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function ConfusionTable({
  modelName,
  confusion,
  view,
}: {
  modelName: string;
  confusion: ConfusionMatrix;
  view: ViewMode;
}) {
  const color = getModelColor(modelName);
  const { names, counts, rates, per_class: perClass } = confusion;

  // Counts shade against the largest cell; rates always shade against 1.0, so
  // the colour means the same thing in every row regardless of class size.
  const maxCount = useMemo(() => Math.max(1, ...counts.flat()), [counts]);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h5 className="text-sm font-medium text-gray-700">
          {modelName.replace(/_/g, ' ')}
        </h5>
        <span className="text-xs text-gray-500 font-mono">
          {formatRate(confusion.accuracy)} accuracy &middot;{' '}
          {confusion.support.toLocaleString()} samples
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <caption className="sr-only">
            Confusion matrix for {modelName.replace(/_/g, ' ')}. Rows are the
            true class, columns are the predicted class.
          </caption>
          <thead>
            <tr>
              <th className="p-1" />
              <th
                className="p-1 text-center font-medium text-gray-500"
                colSpan={names.length}
                scope="colgroup"
              >
                Predicted
              </th>
            </tr>
            <tr>
              <th className="p-1 text-right font-medium text-gray-500">True</th>
              {names.map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="p-1 text-center font-medium text-gray-600 max-w-24 truncate"
                  title={name}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((rowName, i) => (
              <tr key={rowName}>
                <th
                  scope="row"
                  className="p-1 pr-2 text-right font-medium text-gray-600 max-w-24 truncate"
                  title={rowName}
                >
                  {rowName}
                </th>
                {names.map((colName, j) => {
                  const rate = rates[i]?.[j] ?? 0;
                  const count = counts[i]?.[j] ?? 0;
                  const intensity = view === 'rates' ? rate : count / maxCount;
                  return (
                    <td
                      key={colName}
                      className="border border-white p-1.5 text-center font-mono tabular-nums text-gray-900 min-w-16"
                      style={{
                        backgroundColor: cellBackground(color, intensity),
                      }}
                      title={`${count.toLocaleString()} of true ${rowName} predicted ${colName} (${formatRate(rate)})`}
                    >
                      {view === 'rates'
                        ? formatRate(rate)
                        : count.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="text-xs w-full">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left font-medium py-0.5">Class</th>
            <th className="text-right font-medium py-0.5">Precision</th>
            <th className="text-right font-medium py-0.5">Recall</th>
            <th className="text-right font-medium py-0.5">F1</th>
            <th className="text-right font-medium py-0.5">Support</th>
          </tr>
        </thead>
        <tbody>
          {perClass.map((cls) => (
            <tr key={cls.label} className="border-t border-gray-100">
              <td
                className="py-0.5 text-gray-700 max-w-32 truncate"
                title={cls.name}
              >
                {cls.name}
              </td>
              <td className="py-0.5 text-right font-mono tabular-nums text-gray-600">
                {cls.precision.toFixed(3)}
              </td>
              <td className="py-0.5 text-right font-mono tabular-nums text-gray-600">
                {cls.recall.toFixed(3)}
              </td>
              <td className="py-0.5 text-right font-mono tabular-nums text-gray-600">
                {cls.f1.toFixed(3)}
              </td>
              <td className="py-0.5 text-right font-mono tabular-nums text-gray-600">
                {cls.support.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConfusionMatrixSection({
  modelConfigs,
}: ConfusionMatrixSectionProps) {
  const [view, setView] = useState<ViewMode>('rates');

  const modelsWithConfusion = useMemo(
    () =>
      Object.entries(modelConfigs).filter(
        (
          entry
        ): entry is [string, ModelConfig & { confusion: ConfusionMatrix }] =>
          Boolean(entry[1].confusion?.counts?.length)
      ),
    [modelConfigs]
  );

  if (modelsWithConfusion.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 mb-0">Confusion Matrix</h4>
          <div className="group relative">
            <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
              <p className="font-bold mb-1">
                Rows are truth, columns are predictions
              </p>
              <p className="opacity-90 leading-relaxed">
                The diagonal is what the model got right. Everything off it is a
                specific confusion &mdash; which class was mistaken for which,
                rather than a single accuracy number.
              </p>
              <p className="opacity-90 leading-relaxed mt-2">
                <span className="font-semibold">Row %</span> normalises each row
                by its class total, so a rare class is judged on its own terms.
                On an imbalanced target this is the view worth reading: a model
                that predicts the majority class for everything can still score
                high accuracy, and only per-class recall exposes it.
              </p>
              <div className="absolute left-1.5 -bottom-1 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        <div
          className="inline-flex rounded-md border border-gray-200 overflow-hidden"
          role="group"
          aria-label="Confusion matrix display mode"
        >
          {(['rates', 'counts'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`px-2.5 py-1 text-xs transition-colors ${
                view === mode
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode === 'rates' ? 'Row %' : 'Counts'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Test-set predictions for the best configuration of each model.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelsWithConfusion.map(([modelName, cfg]) => (
          <ConfusionTable
            key={modelName}
            modelName={modelName}
            confusion={cfg.confusion}
            view={view}
          />
        ))}
      </div>
    </div>
  );
}
