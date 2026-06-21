'use client';

import { useState, useId } from 'react';

export interface CartCutoff {
  feature: string;
  threshold: number | null;
  rule: string;
  left_class: string;
  right_class: string;
  gini_improvement: number | null;
}

export interface StatisticalAnalysisData {
  top_features: string[];
  cart_cutoffs: Record<string, CartCutoff>;
  box_plot_urls: Record<string, string>;
  ci_bar_urls: Record<string, string>;
}

interface StatisticalAnalysisSectionProps {
  data: StatisticalAnalysisData | null | undefined;
}

function FeaturePanel({
  feature,
  cutoff,
  boxPlotUrl,
  ciBarUrl,
}: {
  feature: string;
  cutoff: CartCutoff | null | undefined;
  boxPlotUrl: string | undefined;
  ciBarUrl: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const buttonId = useId();
  const panelId = useId();

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        id={buttonId}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-mono text-xs text-gray-800 truncate">
          {feature}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
      </button>

      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="p-4 bg-white space-y-4"
        >
          {cutoff && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                CART Cut-off
              </h5>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="py-1.5 pr-4 font-medium text-gray-600 whitespace-nowrap">
                      Rule
                    </td>
                    <td className="py-1.5 font-mono text-gray-800">
                      {cutoff.rule}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1.5 pr-4 font-medium text-gray-600 whitespace-nowrap">
                      Threshold
                    </td>
                    <td className="py-1.5 font-mono text-gray-800">
                      {typeof cutoff.threshold === 'number'
                        ? cutoff.threshold.toFixed(4)
                        : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1.5 pr-4 font-medium text-gray-600 whitespace-nowrap">
                      ≤ threshold → class
                    </td>
                    <td className="py-1.5 text-gray-800">
                      {cutoff.left_class}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1.5 pr-4 font-medium text-gray-600 whitespace-nowrap">
                      &gt; threshold → class
                    </td>
                    <td className="py-1.5 text-gray-800">
                      {cutoff.right_class}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-medium text-gray-600 whitespace-nowrap">
                      Gini improvement
                    </td>
                    <td className="py-1.5 font-mono text-gray-800">
                      {typeof cutoff.gini_improvement === 'number'
                        ? cutoff.gini_improvement.toFixed(4)
                        : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {boxPlotUrl && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Distribution by Class (Box Plot)
              </h5>
              <div className="border rounded overflow-auto bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={boxPlotUrl}
                  alt={`Box plot for ${feature}`}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}

          {ciBarUrl && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Median ± 95% CI by Class
              </h5>
              <div className="border rounded overflow-auto bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ciBarUrl}
                  alt={`95% CI bar chart for ${feature}`}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StatisticalAnalysisSection({
  data,
}: StatisticalAnalysisSectionProps) {
  if (!data || !data.top_features || data.top_features.length === 0)
    return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Statistical Analysis
      </h3>
      <p className="text-xs text-gray-500">
        Top {data.top_features.length} features by convergence-weighted
        importance. Each panel shows the optimal CART binary split, distribution
        by class (box plot), and bootstrap 95% CI of the median.
      </p>
      <div className="space-y-2">
        {data.top_features.map((feature) => (
          <FeaturePanel
            key={feature}
            feature={feature}
            cutoff={data.cart_cutoffs?.[feature]}
            boxPlotUrl={data.box_plot_urls?.[feature]}
            ciBarUrl={data.ci_bar_urls?.[feature]}
          />
        ))}
      </div>
    </div>
  );
}
