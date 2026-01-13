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
        "#3b82f6", // blue-600
        "#60a5fa", // blue-400
        "#93c5fd", // blue-300
        "#bfdbfe", // blue-200
        "#dbeafe", // blue-100
    ],

    /**
     * Reverse blue gradient (light to dark for normalized charts)
     */
    blueGradientReverse: [
        "#93c5fd", // blue-300
        "#60a5fa", // blue-400
        "#3b82f6", // blue-600
        "#2563eb", // blue-700
        "#1d4ed8", // blue-800
    ],

    /**
     * Multi-color palette for comparing multiple models
     */
    multiModel: [
        "#3b82f6", // blue
        "#10b981", // green
        "#f59e0b", // amber
        "#ef4444", // red
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#f97316", // orange
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
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.375rem",
} as const;

/**
 * Standard tooltip label styling (for dark text)
 */
export const TOOLTIP_LABEL_STYLE = {
    color: "#374151",
} as const;

/**
 * Format a numeric value for tooltip display
 */
export function formatTooltipValue(value: number, decimals: number = 4): string {
    return value.toFixed(decimals);
}
