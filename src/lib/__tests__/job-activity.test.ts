import {
  algorithmLabel,
  detectAlgorithm,
  detectAlgorithms,
  parseAlgorithmTag,
  parseWorkCounts,
  isEarlyStop,
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

describe('parseAlgorithmTag', () => {
  it('reads the leading tag', () => {
    expect(parseAlgorithmTag('[xgboost] Trained 190/648 configs.')).toBe(
      'xgboost'
    );
    expect(parseAlgorithmTag('[catboost] Completed 30/150 trials.')).toBe(
      'catboost'
    );
  });

  it('returns null for an untagged message', () => {
    expect(parseAlgorithmTag('Training XGBoost...')).toBeNull();
    expect(parseAlgorithmTag(undefined)).toBeNull();
  });
});

describe('parseWorkCounts', () => {
  it('reads done/total counts', () => {
    expect(parseWorkCounts('[xgboost] Trained 190/648 configs.')).toEqual({
      done: 190,
      total: 648,
    });
  });

  it('ignores a message with no counts', () => {
    expect(parseWorkCounts('[xgboost] Best ROC: 1.0000')).toBeNull();
  });

  it('rejects a zero denominator', () => {
    expect(parseWorkCounts('Trained 0/0 configs')).toBeNull();
  });
});

// The exact message shapes the stream emits, captured from a live run.
describe('reduceAlgorithms with real stream messages', () => {
  const LIVE_MESSAGES = [
    '[xgboost] Trained 190/648 configs. Best ROC: 1.0000',
    '[xgboost] Trained 210/648 configs. Best ROC: 1.0000',
    '[catboost] Completed 30/150 trials. Best ROC AUC: 1.0000',
    '[xgboost] Trained 230/648 configs. Best ROC: 1.0000',
  ];

  const replay = (messages: string[]) =>
    messages.reduce<AlgorithmProgress[]>(
      (state, message) =>
        reduceAlgorithms(state, { status: 'running', message }),
      []
    );

  it('keeps both algorithms running through an interleaved run', () => {
    const state = replay(LIVE_MESSAGES);

    expect(state).toEqual([
      {
        key: 'xgboost',
        label: 'XGBoost',
        state: 'running',
        progress: { done: 230, total: 648 },
        stoppedEarly: false,
      },
      {
        key: 'catboost',
        label: 'CatBoost',
        state: 'running',
        progress: { done: 30, total: 150 },
        stoppedEarly: false,
      },
    ]);
  });

  it('does not complete xgboost when a catboost message lands between its updates', () => {
    const state = replay(LIVE_MESSAGES.slice(0, 3));

    expect(state.find((a) => a.key === 'xgboost')?.state).toBe('running');
  });

  it('reads "Completed 30/150 trials" as progress, not completion', () => {
    const state = replay([LIVE_MESSAGES[2]]);

    expect(state[0]).toEqual({
      key: 'catboost',
      label: 'CatBoost',
      state: 'running',
      progress: { done: 30, total: 150 },
      stoppedEarly: false,
    });
  });

  it('completes an algorithm once its counts reach the total', () => {
    const state = replay([
      '[xgboost] Trained 600/648 configs. Best ROC: 1.0000',
      '[xgboost] Trained 648/648 configs. Best ROC: 1.0000',
    ]);

    expect(state[0].state).toBe('completed');
  });

  it('ignores a stale out-of-order count', () => {
    const state = replay([
      '[xgboost] Trained 230/648 configs.',
      '[xgboost] Trained 190/648 configs.',
    ]);

    expect(state[0].progress).toEqual({ done: 230, total: 648 });
  });

  it('completes everything still running when the job finishes', () => {
    let state = replay(LIVE_MESSAGES);
    state = reduceAlgorithms(state, {
      status: 'completed',
      message: 'Training complete!',
    });

    expect(state.map((a) => a.state)).toEqual(['completed', 'completed']);
  });
});

describe('humanizeJobEvent with real stream messages', () => {
  it('swaps the tag for the display label', () => {
    expect(
      humanizeJobEvent(
        {
          status: 'running',
          message: '[xgboost] Trained 190/648 configs. Best ROC: 1.0000',
        },
        'progress'
      )
    ).toBe('XGBoost - Trained 190/648 configs. Best ROC: 1.0000');
  });

  it('leaves an untagged message alone', () => {
    expect(
      humanizeJobEvent(
        { status: 'running', message: 'Preprocessing data...' },
        'progress'
      )
    ).toBe('Preprocessing data...');
  });
});

describe('overfit_warning (early stop on perfect ROC AUC)', () => {
  const warning = (message: string) => ({
    type: 'overfit_warning' as const,
    status: 'running' as const,
    message,
  });

  it('completes the tagged algorithm short of its total', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: '[xgboost] Trained 190/648 configs. Best ROC: 1.0000',
    });
    state = reduceAlgorithms(
      state,
      warning('[xgboost] Perfect ROC AUC reached, stopping early')
    );

    expect(state[0]).toEqual({
      key: 'xgboost',
      label: 'XGBoost',
      state: 'completed',
      progress: { done: 190, total: 648 },
      stoppedEarly: true,
    });
  });

  it('leaves the other algorithms running, since early stop is per-algorithm', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: '[xgboost] Trained 190/648 configs.',
    });
    state = reduceAlgorithms(state, {
      status: 'running',
      message: '[catboost] Completed 30/150 trials.',
    });
    state = reduceAlgorithms(state, warning('[xgboost] Perfect ROC AUC'));

    expect(state.map((a) => [a.key, a.state])).toEqual([
      ['xgboost', 'completed'],
      ['catboost', 'running'],
    ]);
  });

  it('walks back to running when training carries on (early stop disabled)', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: '[xgboost] Trained 190/648 configs.',
    });
    state = reduceAlgorithms(state, warning('[xgboost] Perfect ROC AUC'));
    expect(state[0].state).toBe('completed');

    // Early stop was off, so the sweep continues.
    state = reduceAlgorithms(state, {
      status: 'running',
      message: '[xgboost] Trained 210/648 configs.',
    });

    expect(state[0]).toEqual({
      key: 'xgboost',
      label: 'XGBoost',
      state: 'running',
      progress: { done: 210, total: 648 },
      stoppedEarly: false,
    });
  });

  it('does not resurrect an algorithm that completed normally', () => {
    let state = reduceAlgorithms([], {
      status: 'running',
      message: '[xgboost] Trained 648/648 configs.',
    });
    expect(state[0].state).toBe('completed');

    state = reduceAlgorithms(state, {
      status: 'running',
      message: '[xgboost] Trained 648/648 configs.',
    });

    expect(state[0].state).toBe('completed');
  });

  it('renders a warning line in the activity log', () => {
    expect(
      humanizeJobEvent(
        {
          type: 'overfit_warning',
          status: 'running',
          message: '[xgboost] Perfect ROC AUC reached',
        },
        'overfit_warning'
      )
    ).toBe('Overfit warning - XGBoost - Perfect ROC AUC reached');
  });

  it('falls back to a default line when the warning carries no message', () => {
    expect(
      humanizeJobEvent({ type: 'overfit_warning' }, 'overfit_warning')
    ).toBe('Overfit warning: perfect ROC AUC reached.');
  });
});

describe('isEarlyStop', () => {
  it.each([
    '[xgboost] Stopped early: perfect ROC AUC reached',
    '[xgboost] Stopping early on perfect AUC',
    '[xgboost] Early stop triggered',
  ])('treats %s as an early stop', (message) => {
    expect(isEarlyStop(message)).toBe(true);
  });

  it.each([
    '[xgboost] Training with early stopping',
    '[xgboost] Early stopping enabled',
    '[xgboost] Trained 190/648 configs.',
  ])('does not treat %s as an early stop', (message) => {
    expect(isEarlyStop(message)).toBe(false);
  });
});

describe('reduceAlgorithms', () => {
  it('marks a detected algorithm as running', () => {
    const result = reduceAlgorithms([], {
      status: 'running',
      message: 'Training Random Forest...',
    });

    expect(result).toEqual([
      {
        key: 'random_forest',
        label: 'Random Forest',
        state: 'running',
        progress: null,
        stoppedEarly: false,
      },
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
      {
        key: 'random_forest',
        label: 'Random Forest',
        state: 'completed',
        progress: null,
        stoppedEarly: false,
      },
      {
        key: 'xgboost',
        label: 'XGBoost',
        state: 'running',
        progress: null,
        stoppedEarly: false,
      },
    ]);
  });

  it('marks an algorithm complete when the message says so', () => {
    const state = reduceAlgorithms([], {
      status: 'running',
      message: 'XGBoost training complete',
    });

    expect(state).toEqual([
      {
        key: 'xgboost',
        label: 'XGBoost',
        state: 'completed',
        progress: null,
        stoppedEarly: false,
      },
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
      {
        key: 'catboost',
        label: 'CatBoost',
        state: 'completed',
        progress: null,
        stoppedEarly: false,
      },
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
      {
        key: 'random_forest',
        label: 'Random Forest',
        state: 'completed',
        progress: null,
        stoppedEarly: false,
      },
      {
        key: 'xgboost',
        label: 'XGBoost',
        state: 'running',
        progress: null,
        stoppedEarly: false,
      },
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
        {
          key: 'xgboost',
          label: 'XGBoost',
          state: 'running',
          progress: null,
          stoppedEarly: false,
        },
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
        progress: null,
        stoppedEarly: false,
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
