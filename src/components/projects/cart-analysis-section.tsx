'use client';

import { useState, useEffect } from 'react';

interface CARTAnalysisSectionProps {
  graphSvgUrl: string | null | undefined;
  analysisReportUrl: string | null | undefined;
}

export function CARTAnalysisSection({
  graphSvgUrl,
  analysisReportUrl,
}: CARTAnalysisSectionProps) {
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportError, setReportError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!analysisReportUrl) return;
    fetch(analysisReportUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(setReportText)
      .catch(() => setReportError(true));
  }, [analysisReportUrl]);

  if (!graphSvgUrl && !analysisReportUrl) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        CART Surrogate Analysis
      </h3>

      {graphSvgUrl && (
        <div className="border rounded-lg overflow-auto bg-white p-2">
          <img
            src={graphSvgUrl}
            alt="CART surrogate decision tree"
            className="max-w-full h-auto"
          />
        </div>
      )}

      {analysisReportUrl && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>Analysis Narrative</span>
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
            <div className="p-4 bg-white">
              {reportError ? (
                <p className="text-sm text-red-500">
                  Failed to load analysis report.
                </p>
              ) : reportText === null ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {reportText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
