'use client';

import { useState } from 'react';

interface ConvergenceEntry {
  feature: string;
  model_count: number;
  algorithms: string[];
}

interface ConvergenceCluster {
  start_position: number;
  end_position: number;
  size: number;
  max_agreement: number;
  algorithms: string[];
}

export interface ConvergenceTableData {
  entries: ConvergenceEntry[];
  clusters: ConvergenceCluster[];
  top_n_used: number;
  model_count: number;
}

const ALGO_LABELS: Record<string, string> = {
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  catboost: 'CatBoost',
  lightgbm: 'LightGBM',
  linear_boost: 'LinearBoost',
  linearboost: 'LinearBoost',
};

function fmtAlgo(algo: string): string {
  return ALGO_LABELS[algo] ?? algo;
}

function agreementBadgeClass(count: number, total: number): string {
  if (count === total) return 'bg-purple-100 text-purple-800';
  if (count >= 3) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-600';
}

function EntryTable({
  entries,
  totalModels,
}: {
  entries: ConvergenceEntry[];
  totalModels: number;
}) {
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b">
          <th className="px-3 py-2 text-left font-semibold text-gray-600">
            Feature
          </th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600 w-16">
            Models
          </th>
          <th className="px-3 py-2 text-left font-semibold text-gray-600">
            Algorithms
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr
            key={entry.feature}
            className="border-b last:border-0 hover:bg-gray-50"
          >
            <td className="px-3 py-1.5 font-mono text-gray-800">
              {entry.feature}
            </td>
            <td className="px-3 py-1.5 text-center">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${agreementBadgeClass(entry.model_count, totalModels)}`}
              >
                {entry.model_count}
              </span>
            </td>
            <td className="px-3 py-1.5 text-gray-600">
              {entry.algorithms?.map(fmtAlgo).join(', ') ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ConvergenceTableSection({
  data,
}: {
  data: ConvergenceTableData | null | undefined;
}) {
  const [showTwoModel, setShowTwoModel] = useState(false);

  if (!data || !data.entries || data.entries.length === 0) return null;

  const { entries, clusters, top_n_used, model_count } = data;

  const highAgreement = entries.filter((e) => e.model_count >= 3);
  const twoModel = entries.filter((e) => e.model_count === 2);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">
          Feature Convergence
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Features independently identified by multiple algorithms in their top-
          {top_n_used} importance rankings ({model_count} models evaluated).
          Convergence across independent algorithms is a stronger signal than
          any single-model ranking — in high-dimensional genomic data, the most
          meaningful features are those on which algorithms agree.
        </p>
      </div>

      {highAgreement.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            3+ model agreement ({highAgreement.length})
          </p>
          <div className="border rounded overflow-hidden">
            <EntryTable entries={highAgreement} totalModels={model_count} />
          </div>
        </div>
      )}

      {twoModel.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowTwoModel((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showTwoModel ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            2-model agreement ({twoModel.length})
          </button>
          {showTwoModel && (
            <div className="border rounded overflow-hidden">
              <EntryTable entries={twoModel} totalModels={model_count} />
            </div>
          )}
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Positional Clusters
          </p>
          <p className="text-xs text-gray-400">
            Contiguous genomic regions where multiple converging features are
            concentrated. Features within 200 positions of each other are
            grouped into a cluster.
          </p>
          <div className="space-y-1.5">
            {clusters.map((c) => (
              <div
                key={`${c.start_position}-${c.end_position}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2"
              >
                <span className="font-mono font-medium text-gray-800">
                  Pos_{c.start_position}–Pos_{c.end_position}
                </span>
                <span className="text-gray-500">{c.size} features</span>
                <span className="text-gray-500">
                  up to {c.max_agreement}-model agreement
                </span>
                <span className="text-gray-600">
                  {c.algorithms?.map(fmtAlgo).join(', ') ?? ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
