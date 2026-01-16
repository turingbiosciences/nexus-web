/**
 * Tests for parse-feature-importance utilities
 */

import {
  parseFeatureImportance,
  parseFeatureImportanceByModel,
  findElbowPoint,
  FeatureImportanceData,
} from '../parse-feature-importance';

describe('parseFeatureImportance', () => {
  describe('array format input', () => {
    it('handles array of objects with name and importance', () => {
      const input = [
        { name: 'feature1', importance: 0.5 },
        { name: 'feature2', importance: 0.3 },
      ];

      const result = parseFeatureImportance(input);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('feature1');
      expect(result[0].importance).toBe(0.5);
    });

    it('handles array of objects with feature and importance', () => {
      const input = [
        { feature: 'feat_a', importance: 0.8 },
        { feature: 'feat_b', importance: 0.2 },
      ];

      const result = parseFeatureImportance(input);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('feat_a');
    });

    it('sorts by importance descending', () => {
      const input = [
        { name: 'low', importance: 0.1 },
        { name: 'high', importance: 0.9 },
        { name: 'medium', importance: 0.5 },
      ];

      const result = parseFeatureImportance(input);

      expect(result[0].name).toBe('high');
      expect(result[1].name).toBe('medium');
      expect(result[2].name).toBe('low');
    });

    it('generates default names for items without name/feature', () => {
      const input = [{ importance: 0.5 }, { importance: 0.3 }];

      const result = parseFeatureImportance(input as FeatureImportanceData[]);

      expect(result[0].name).toBe('Feature 1');
      expect(result[1].name).toBe('Feature 2');
    });
  });

  describe('rank structure input', () => {
    it('handles rank_1, rank_2 format', () => {
      const input = {
        rank_1: { feature: 'top_feature', importance: 0.9 },
        rank_2: { feature: 'second_feature', importance: 0.7 },
        rank_3: { feature: 'third_feature', importance: 0.5 },
      };

      const result = parseFeatureImportance(input);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('top_feature');
      expect(result[0].importance).toBe(0.9);
    });

    it('preserves normalized_importance if present', () => {
      const input = {
        rank_1: {
          feature: 'feat',
          importance: 0.5,
          normalized_importance: 75,
        },
      };

      const result = parseFeatureImportance(input);

      expect(result[0].normalizedImportance).toBe(75);
    });

    it('trims whitespace from feature names', () => {
      const input = {
        rank_1: { feature: '  feature_with_spaces  ', importance: 0.5 },
      };

      const result = parseFeatureImportance(input);

      expect(result[0].name).toBe('feature_with_spaces');
    });
  });

  describe('key-value pairs input', () => {
    it('handles simple key-value object', () => {
      const input = {
        feature_a: 0.8,
        feature_b: 0.6,
        feature_c: 0.4,
      };

      const result = parseFeatureImportance(input);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('feature_a');
      expect(result[0].importance).toBe(0.8);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for null input', () => {
      const result = parseFeatureImportance(null);
      expect(result).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      const result = parseFeatureImportance(undefined);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty object', () => {
      const result = parseFeatureImportance({});
      expect(result).toEqual([]);
    });

    it('returns empty array for empty array', () => {
      const result = parseFeatureImportance([]);
      expect(result).toEqual([]);
    });

    it('converts invalid importance values to 0', () => {
      const input = [
        { name: 'valid', importance: 0.5 },
        { name: 'invalid', importance: 'not a number' as unknown as number },
      ];

      const result = parseFeatureImportance(input);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('valid');
      expect(result[0].importance).toBe(0.5);
      // Invalid values are converted to 0
      expect(result[1].importance).toBe(0);
    });
  });
});

describe('parseFeatureImportanceByModel', () => {
  it('groups data by model name', () => {
    const input = {
      model_a: {
        rank_1: { feature: 'feat1', importance: 0.9 },
        rank_2: { feature: 'feat2', importance: 0.7 },
      },
      model_b: {
        rank_1: { feature: 'feat3', importance: 0.8 },
      },
    };

    const result = parseFeatureImportanceByModel(input);

    expect(result).toHaveLength(2);
    expect(result[0].modelName).toBe('model_a');
    expect(result[0].features).toHaveLength(2);
    expect(result[1].modelName).toBe('model_b');
    expect(result[1].features).toHaveLength(1);
  });

  it('respects limit parameter', () => {
    const input = {
      model: {
        rank_1: { feature: 'f1', importance: 0.9 },
        rank_2: { feature: 'f2', importance: 0.8 },
        rank_3: { feature: 'f3', importance: 0.7 },
        rank_4: { feature: 'f4', importance: 0.6 },
        rank_5: { feature: 'f5', importance: 0.5 },
      },
    };

    const result = parseFeatureImportanceByModel(input, 3);

    expect(result[0].features).toHaveLength(3);
  });

  it('returns empty array for null input', () => {
    const result = parseFeatureImportanceByModel(
      null as unknown as Record<string, unknown>
    );
    expect(result).toEqual([]);
  });

  it('skips models with no valid features', () => {
    const input = {
      valid_model: {
        rank_1: { feature: 'feat', importance: 0.5 },
      },
      invalid_model: {},
    };

    const result = parseFeatureImportanceByModel(input);

    expect(result).toHaveLength(1);
    expect(result[0].modelName).toBe('valid_model');
  });
});

describe('findElbowPoint', () => {
  it('returns minimum for very small arrays', () => {
    const features = [{ name: 'a', importance: 0.9 }];
    const result = findElbowPoint(features);
    expect(result).toBeLessThanOrEqual(5);
  });

  it('returns at least 3 for larger arrays', () => {
    const features = [
      { name: 'a', importance: 0.9 },
      { name: 'b', importance: 0.8 },
      { name: 'c', importance: 0.7 },
      { name: 'd', importance: 0.6 },
      { name: 'e', importance: 0.5 },
    ];

    const result = findElbowPoint(features);

    expect(result).toBeGreaterThanOrEqual(3);
  });

  it('returns at most 10', () => {
    const features = Array.from({ length: 20 }, (_, i) => ({
      name: `feature_${i}`,
      importance: 1 - i * 0.05,
    }));

    const result = findElbowPoint(features);

    expect(result).toBeLessThanOrEqual(10);
  });

  it('finds elbow point for exponentially decreasing data', () => {
    // Simulate typical feature importance curve with sharp drop-off
    const features = [
      { name: 'f1', importance: 0.5 },
      { name: 'f2', importance: 0.3 },
      { name: 'f3', importance: 0.1 },
      { name: 'f4', importance: 0.05 },
      { name: 'f5', importance: 0.02 },
      { name: 'f6', importance: 0.01 },
    ];

    const result = findElbowPoint(features);

    expect(result).toBeGreaterThanOrEqual(3);
    expect(result).toBeLessThanOrEqual(10);
  });
});
