/**
 * Centralized chart configuration for consistent styling across all chart components.
 * This eliminates repeated color palette and style definitions.
 */

/**
 * Color palettes for various chart types
 */
export const CHART_COLORS = {
  /**
   * Blue gradient for single-model feature importance (light to dark)
   */
  blueGradient: [
    '#1e3a8a', // blue-900
    '#1e40af', // blue-800
    '#1d4ed8', // blue-700
    '#2563eb', // blue-600
    '#3b82f6', // blue-500
    '#60a5fa', // blue-400
    '#93c5fd', // blue-300
    '#bfdbfe', // blue-200
    '#dbeafe', // blue-100
    '#eff6ff', // blue-50
  ],

  /**
   * Reverse blue gradient (light to dark for normalized charts)
   */
  blueGradientReverse: [
    '#eff6ff', // blue-50
    '#dbeafe', // blue-100
    '#bfdbfe', // blue-200
    '#93c5fd', // blue-300
    '#60a5fa', // blue-400
    '#3b82f6', // blue-500
    '#2563eb', // blue-600
    '#1d4ed8', // blue-700
    '#1e40af', // blue-800
    '#1e3a8a', // blue-900
  ],

  /**
   * Multi-color palette for comparing multiple models
   */
  multiModel: [
    '#1e3a8a', // blue-900
    '#3b82f6', // blue-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
    '#8b5cf6', // purple-500
    '#0ea5e9', // sky-500
    '#4f46e5', // indigo-600
    '#2dd4bf', // teal-400
  ],
} as const;

/**
 * Get a color from a palette by index (cycles through colors if index exceeds palette length)
 */
export function getChartColor(
  palette: readonly string[],
  index: number
): string {
  return palette[index % palette.length];
}

/**
 * Standard tooltip styling for Recharts
 */
export const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
} as const;

/**
 * Standard tooltip label styling (for dark text)
 */
export const TOOLTIP_LABEL_STYLE = {
  color: '#374151',
} as const;

/**
 * Format a numeric value for tooltip display
 */
export function formatTooltipValue(
  value: number,
  decimals: number = 4
): string {
  return value.toFixed(decimals);
}
