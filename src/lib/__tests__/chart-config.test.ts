/**
 * Tests for chart-config utilities
 */

import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  getChartColor,
  formatTooltipValue,
} from '../chart-config';

describe('chart-config', () => {
  describe('CHART_COLORS', () => {
    it('exports blueGradient color array with 10 colors', () => {
      expect(CHART_COLORS.blueGradient).toHaveLength(10);
      expect(CHART_COLORS.blueGradient[0]).toBe('#1e3a8a');
    });

    it('exports blueGradientReverse color array with 10 colors', () => {
      expect(CHART_COLORS.blueGradientReverse).toHaveLength(10);
      expect(CHART_COLORS.blueGradientReverse[0]).toBe('#eff6ff');
    });

    it('exports multiModel color array with 8 colors', () => {
      expect(CHART_COLORS.multiModel).toHaveLength(8);
      expect(CHART_COLORS.multiModel[0]).toBe('#1e3a8a');
      expect(CHART_COLORS.multiModel[2]).toBe('#06b6d4');
    });

    it('all colors are valid hex codes', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;

      CHART_COLORS.blueGradient.forEach((color) => {
        expect(color).toMatch(hexRegex);
      });

      CHART_COLORS.multiModel.forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });
  });

  describe('getChartColor', () => {
    it('returns correct color for valid index', () => {
      const result = getChartColor(CHART_COLORS.blueGradient, 0);
      expect(result).toBe('#1e3a8a');
    });

    it('returns correct color for middle index', () => {
      const result = getChartColor(CHART_COLORS.blueGradient, 4);
      expect(result).toBe('#3b82f6');
    });

    it('cycles through colors when index exceeds array length', () => {
      // blueGradient has 10 colors, index 10 should wrap to index 0
      const result = getChartColor(CHART_COLORS.blueGradient, 10);
      expect(result).toBe(CHART_COLORS.blueGradient[0]);
    });

    it('cycles correctly for large index', () => {
      // Index 24 with 10 colors = index 4
      const result = getChartColor(CHART_COLORS.blueGradient, 24);
      expect(result).toBe(CHART_COLORS.blueGradient[4]);
    });

    it('works with multiModel palette', () => {
      const result = getChartColor(CHART_COLORS.multiModel, 2);
      expect(result).toBe('#06b6d4'); // cyan
    });
  });

  describe('formatTooltipValue', () => {
    it('formats number with default 4 decimal places', () => {
      const result = formatTooltipValue(0.123456789);
      expect(result).toBe('0.1235');
    });

    it('formats number with custom decimal places', () => {
      const result = formatTooltipValue(0.123456789, 2);
      expect(result).toBe('0.12');
    });

    it('formats whole numbers correctly', () => {
      const result = formatTooltipValue(42);
      expect(result).toBe('42.0000');
    });

    it('handles zero', () => {
      const result = formatTooltipValue(0);
      expect(result).toBe('0.0000');
    });

    it('handles negative numbers', () => {
      const result = formatTooltipValue(-1.5, 2);
      expect(result).toBe('-1.50');
    });
  });

  describe('TOOLTIP_STYLE', () => {
    it('has expected backgroundColor', () => {
      expect(TOOLTIP_STYLE.backgroundColor).toBe('#fff');
    });

    it('has expected border', () => {
      expect(TOOLTIP_STYLE.border).toBe('1px solid #e5e7eb');
    });

    it('has expected borderRadius', () => {
      expect(TOOLTIP_STYLE.borderRadius).toBe('0.375rem');
    });
  });

  describe('TOOLTIP_LABEL_STYLE', () => {
    it('has expected color', () => {
      expect(TOOLTIP_LABEL_STYLE.color).toBe('#374151');
    });
  });
});
