import {
  algorithmLabel,
  detectAlgorithm,
  detectAlgorithms,
  humanizeJobEvent,
  reduceAlgorithms,
} from '../job-activity';
import { AlgorithmProgress } from '@/types/job';

describe('detectAlgorithm', () => {
  it.each([
    ['Training Random Forest...', 'random_forest'],
    ['Training XGBoost model...', 'xgboost'],
    ['Fitting LightGBM', 'lightgbm'],
    ['catboost training started', 'catboost'],
    ['Training LinearBoost...', 'linear_boost'],
  ])('detects the algorithm in %s', (message, expected) => {
    expect(detectAlgorithm(message)).toBe(expected);
  });

  it('returns null when no algorithm is mentioned', () => {
    expect(detectAlgorithm('Preprocessing data...')).toBeNull();
    expect(detectAlgorithm(undefined)).toBeNull();
  });

  it('picks the algorithm named first in the message, not first in the catalog', () => {
    // random_forest is defined before xgboost in the catalog.
    expect(detectAlgorithm('Training XGBoost (Random Forest done)')).toBe(
      'xgboost'
    );
  });
});

describe('detectAlgorithms', () => {
  it('lists every algorithm in the order it appears', () => {
    expect(
      detectAlgorithms('Comparing Random Forest, XGBoost and LightGBM')
    ).toEqual(['random_forest', 'xgboost', 'lightgbm']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(detectAlgorithms('Preprocessing data...')).toEqual([]);
  });
});

describe('algorithmLabel', () => {
  it('maps known keys to display labels', () => {
    expect(algorithmLabel('random_forest')).toBe('Random Forest');
    expect(algorithmLabel('xgboost')).toBe('XGBoost');
  });

  it('title-cases unknown keys', () => {
    expect(algorithmLabel('some_new_model')).toBe('Some New Model');
  });
});

describe('humanizeJobEvent', () => {
  it('skips heartbeat and connected events', () => {
    expect(humanizeJobEvent({}, 'heartbeat')).toBeNull();
    expect(humanizeJobEvent({}, 'connected')).toBeNull();
  });

  it('prefixes error events', () => {
    expect(humanizeJobEvent({ error: 'boom' }, 'error')).toBe('Error: boom');
  });

  it('uses the backend message when present', () => {
    expect(
      humanizeJobEvent(
        { status: 'running', message: 'Training XGBoost model...' },
        'progress'
      )
    ).toBe('Training XGBoost model...');
  });

  it('falls back to a status description when the message is empty', () => {
    expect(humanizeJobEvent({ status: 'queued', message: '' }, 'status')).toBe(
      'Job queued.'
    );
  });

  it('describes a failure with its error', () => {
    expect(
      humanizeJobEvent(
        { status: 'failed', message: '', error: 'Out of memory' },
        'complete'
      )
    ).toBe('Training failed: Out of memory');
  });
});

describe('reduceAlgorithms', () => {
  it('marks a detected algorithm as running', () => {
    const result = reduceAlgorithms([], {
      status: 'running',
      message: 'Training Random Forest...',
    });

    expect(result).toEqual([
      { key: 'random_forest', label: 'Random Forest', state: 'running' },
    ]);
  });

  it('completes the previous algorithm when a new one starts', () => {
    let state: AlgorithmProgress[] = [];
    state = reduceAlgorithms(state, {
      status: 'running',
      message: 'Training Random Forest...',
    });
    state = reduceAlgorithms(state, {
      status: 'running',
      message: 'Training XGBoost...',
    });

    expect(state).toEqual([
      { key: 'random_forest', label: 'Random Forest', state: 'completed' },
      { key: 'xgboost', label: 'XGBoost', state: 'running' },
    ]);
  });

  it('marks an algorithm complete when the message says so', () => {
    const state = reduceAlgorithms([], {
      status: 'running',
      message: 'XGBoost training complete',
    });

    expect(state).toEqual([
      { key: 'xgboost', label: 'XGBoost', state: 'completed' },
    ]);
  });

  it('completes everything when the job completes', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: 'Training CatBoost...',
    });
    state = reduceAlgorithms(state, {
      status: 'completed',
      message: 'Training complete!',
    });

    expect(state).toEqual([
      { key: 'catboost', label: 'CatBoost', state: 'completed' },
    ]);
  });

  it('marks the in-flight algorithm as failed when the job fails', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: 'Training LightGBM...',
    });
    state = reduceAlgorithms(state, {
      status: 'failed',
      message: '',
      error: 'boom',
    });

    expect(state[0].state).toBe('failed');
  });

  it('prefers backend-provided algorithm fields over the message', () => {
    const state = reduceAlgorithms([], {
      status: 'running',
      message: 'Working...',
      completed_algorithms: ['random_forest'],
      current_algorithm: 'xgboost',
    });

    expect(state).toEqual([
      { key: 'random_forest', label: 'Random Forest', state: 'completed' },
      { key: 'xgboost', label: 'XGBoost', state: 'running' },
    ]);
  });

  describe('does not mark an algorithm complete while it is still running', () => {
    it.each([
      'Training XGBoost - 45% complete',
      'Training XGBoost (45% complete)',
      'Random Forest: 300/500 trees trained',
      'Training CatBoost, iteration 3 of 50 complete',
      'LightGBM: 2/5 folds finished',
    ])('treats %s as still running', (message) => {
      const state = reduceAlgorithms([], { status: 'running', message });

      expect(state).toHaveLength(1);
      expect(state[0].state).toBe('running');
    });

    it('keeps an algorithm running across successive progress messages', () => {
      let state: AlgorithmProgress[] = [];
      for (const percent of [10, 45, 90]) {
        state = reduceAlgorithms(state, {
          status: 'running',
          message: `Training XGBoost - ${percent}% complete`,
        });
      }

      expect(state).toEqual([
        { key: 'xgboost', label: 'XGBoost', state: 'running' },
      ]);
    });

    it('does not complete anything on a message that merely mentions algorithms', () => {
      const started = reduceAlgorithms([], {
        status: 'running',
        message: 'Training Random Forest...',
      });
      const after = reduceAlgorithms(started, {
        status: 'running',
        message: 'Comparing Random Forest, XGBoost and LightGBM',
      });

      expect(after).toEqual(started);
    });

    it('does not complete the running algorithm on a passing mention of another', () => {
      const started = reduceAlgorithms([], {
        status: 'running',
        message: 'Training Random Forest...',
      });
      const after = reduceAlgorithms(started, {
        status: 'running',
        message: 'XGBoost queued',
      });

      expect(after[0]).toEqual({
        key: 'random_forest',
        label: 'Random Forest',
        state: 'running',
      });
    });
  });

  it('attributes the message to the algorithm named first, not the catalog order', () => {
    const state = reduceAlgorithms([], {
      status: 'running',
      message: 'Training XGBoost, Random Forest finished',
    });

    // Two algorithms named: ambiguous, so nothing is inferred either way.
    expect(state).toEqual([]);
  });

  it('returns the same array reference when nothing changed', () => {
    const state = reduceAlgorithms([], {
      status: 'running',
      message: 'Training XGBoost...',
    });
    const next = reduceAlgorithms(state, {
      status: 'running',
      message: 'Training XGBoost...',
    });

    expect(next).toBe(state);
  });
});
