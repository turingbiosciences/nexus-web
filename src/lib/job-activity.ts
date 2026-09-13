/**
 * Helpers for turning raw SSE job events into human-readable activity lines
 * and into per-algorithm progress used by the training progress card.
 *
 * The stream payload (see SSE_ENDPOINT_SPEC.md) only guarantees `message`, so
 * algorithm tracking falls back to parsing that message. If the backend later
 * starts sending `current_algorithm` / `completed_algorithms`, those are used
 * verbatim and take precedence over the parsed message.
 */
import { JobStatusEvent, AlgorithmProgress } from '@/types/job';

interface AlgorithmDefinition {
  key: string;
  label: string;
  /** Matched case-insensitively against the event message. */
  patterns: RegExp[];
}

/**
 * Algorithms the training pipeline can report. Keys match the snake_case names
 * used elsewhere in the app (convergence table, SHAP charts).
 */
const ALGORITHMS: AlgorithmDefinition[] = [
  {
    key: 'random_forest',
    label: 'Random Forest',
    patterns: [/random[\s_-]?forest/i, /\brf\b/i],
  },
  { key: 'xgboost', label: 'XGBoost', patterns: [/xgboost/i, /\bxgb\b/i] },
  {
    key: 'lightgbm',
    label: 'LightGBM',
    patterns: [/light[\s_-]?gbm/i, /\blgbm\b/i],
  },
  { key: 'catboost', label: 'CatBoost', patterns: [/cat[\s_-]?boost/i] },
  {
    key: 'linear_boost',
    label: 'LinearBoost',
    patterns: [/linear[\s_-]?boost/i],
  },
  {
    key: 'gradient_boosting',
    label: 'Gradient Boosting',
    patterns: [/gradient[\s_-]?boost(ing)?/i],
  },
  {
    key: 'extra_trees',
    label: 'Extra Trees',
    patterns: [/extra[\s_-]?trees/i],
  },
  {
    key: 'decision_tree',
    label: 'Decision Tree',
    patterns: [/decision[\s_-]?tree/i],
  },
  {
    key: 'logistic_regression',
    label: 'Logistic Regression',
    patterns: [/logistic[\s_-]?regression/i],
  },
  {
    key: 'neural_network',
    label: 'Neural Network',
    patterns: [/neural[\s_-]?net(work)?/i, /\bmlp\b/i],
  },
];

const ALGORITHM_BY_KEY = new Map(ALGORITHMS.map((a) => [a.key, a]));

/**
 * A quantity in the message means work is still under way, even when the word
 * "complete" appears: "Training XGBoost - 45% complete" and "Random Forest:
 * 300/500 trees trained" are both progress, not completion. This check runs
 * before DONE_PHRASE for that reason.
 */
const PROGRESS_QUANTITY = /\d+\s*%|\b\d+\s*(?:\/|of)\s*\d+\b/i;

/**
 * Words that mean the named algorithm has finished. Deliberately narrow:
 * falsely showing a chip as complete is worse than showing it as still
 * running, since a missed completion self-corrects when the next algorithm
 * starts or the job ends.
 */
const DONE_PHRASE = /\b(complete|completed|finished)\b/i;

/** Words that mean work on the named algorithm has actually begun. */
const STARTED_PHRASE =
  /\b(training|fitting|running|starting|begin|beginning|tuning|searching|optimizing|optimising|cross[\s-]?validating)\b/i;

/**
 * Turn an arbitrary algorithm identifier into its snake_case key.
 */
function toKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/**
 * Human-friendly label for an algorithm key (falls back to title-casing).
 */
export function algorithmLabel(key: string): string {
  const known = ALGORITHM_BY_KEY.get(toKey(key));
  if (known) return known.label;

  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Find every algorithm mentioned in a status message, ordered by where it
 * appears in the text.
 *
 * Ordering by position rather than by catalog order matters: "Training XGBoost
 * (Random Forest done)" is about XGBoost, and iterating the catalog would
 * wrongly pick Random Forest just because it is defined first.
 */
export function detectAlgorithms(message: string | undefined): string[] {
  if (!message) return [];

  const hits: { key: string; index: number }[] = [];

  for (const algo of ALGORITHMS) {
    let earliest = -1;
    for (const pattern of algo.patterns) {
      const match = pattern.exec(message);
      if (match && (earliest === -1 || match.index < earliest)) {
        earliest = match.index;
      }
    }
    if (earliest !== -1) {
      hits.push({ key: algo.key, index: earliest });
    }
  }

  return hits.sort((a, b) => a.index - b.index).map((hit) => hit.key);
}

/**
 * Find the algorithm a status message is about, if any.
 *
 * @returns the algorithm key, or null when no known algorithm is mentioned
 */
export function detectAlgorithm(message: string | undefined): string | null {
  return detectAlgorithms(message)[0] ?? null;
}

/**
 * Decide whether a message describes an algorithm that is still working or one
 * that has finished.
 */
function inferState(message: string): AlgorithmProgress['state'] {
  // A progress quantity outranks any "complete" wording in the same message.
  if (PROGRESS_QUANTITY.test(message)) return 'running';
  if (DONE_PHRASE.test(message)) return 'completed';
  return 'running';
}

/**
 * Build a short, human-readable line describing an SSE event.
 *
 * @returns the line to show, or null for events with nothing worth showing
 *   (heartbeats, connection notices, empty messages)
 */
export function humanizeJobEvent(
  event: Partial<JobStatusEvent>,
  eventType: string
): string | null {
  if (eventType === 'heartbeat' || eventType === 'connected') {
    return null;
  }

  if (eventType === 'error' || event.type === 'error') {
    return `Error: ${event.error || 'Unknown streaming error'}`;
  }

  const message = event.message?.trim();

  if (event.status === 'completed') {
    return message || 'Training completed successfully.';
  }
  if (event.status === 'failed') {
    return event.error ? `Training failed: ${event.error}` : 'Training failed.';
  }
  if (event.status === 'cancelled') {
    return message || 'Training was cancelled.';
  }

  if (message) return message;

  switch (event.status) {
    case 'pending':
      return 'Job created, waiting to start.';
    case 'queued':
      return 'Job queued.';
    case 'running':
      return 'Training started.';
    default:
      return null;
  }
}

/**
 * Fold an event into the running list of algorithms.
 *
 * Order is preserved: an algorithm keeps the slot it first appeared in, so the
 * chips under the progress bar do not jump around between updates.
 */
export function reduceAlgorithms(
  previous: AlgorithmProgress[],
  event: Partial<JobStatusEvent>
): AlgorithmProgress[] {
  let next = previous.map((algo) => ({ ...algo }));
  let changed = false;

  const upsert = (key: string, state: AlgorithmProgress['state']) => {
    const existing = next.find((algo) => algo.key === key);
    if (!existing) {
      next.push({ key, label: algorithmLabel(key), state });
      changed = true;
      return;
    }
    // Never walk an algorithm backwards out of a terminal state.
    if (existing.state === 'running' && existing.state !== state) {
      existing.state = state;
      changed = true;
    }
  };

  // Backend-provided lists win over anything parsed from the message.
  for (const name of event.completed_algorithms ?? []) {
    upsert(toKey(name), 'completed');
  }

  const message = event.message ?? '';

  if (event.current_algorithm) {
    // The backend told us exactly what is running; trust it.
    upsert(toKey(event.current_algorithm), 'running');
  } else {
    const mentioned = detectAlgorithms(message);

    // A message naming several algorithms ("Comparing Random Forest, XGBoost")
    // is a summary, not a statement about one algorithm's state. Guessing which
    // it refers to is how chips end up marked complete while still training,
    // so leave the list alone.
    if (mentioned.length === 1) {
      const current = mentioned[0];
      const state = inferState(message);

      if (state === 'completed') {
        upsert(current, 'completed');
      } else {
        // Only conclude the pipeline moved on when this message actually says
        // work on the new algorithm began. A passing mention is not evidence
        // that anything else finished.
        if (STARTED_PHRASE.test(message)) {
          for (const algo of next) {
            if (algo.state === 'running' && algo.key !== current) {
              algo.state = 'completed';
              changed = true;
            }
          }
        }
        upsert(current, 'running');
      }
    }
  }

  if (event.status === 'completed') {
    for (const algo of next) {
      if (algo.state === 'running') {
        algo.state = 'completed';
        changed = true;
      }
    }
  } else if (event.status === 'failed' || event.status === 'cancelled') {
    for (const algo of next) {
      if (algo.state === 'running') {
        algo.state = 'failed';
        changed = true;
      }
    }
  }

  // Preserve identity when nothing moved so React can skip re-rendering.
  if (!changed) {
    next = previous;
  }
  return next;
}
