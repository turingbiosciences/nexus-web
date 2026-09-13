/**
 * Job status types for ML training runs
 */

/**
 * Possible states for a training job
 */
export type JobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Job object returned from API
 */
export interface Job {
  job_id: string;
  project_id: string;
  status: JobStatus;
  created_at: string;
  completed_at: string | null;
  progress_percent: number;
  message: string;
  error: string | null;
  best_model: string | null;
  metrics: Record<string, number> | null;
  models_trained: number | null;
  feature_importance: Record<string, number> | null;
  results_csv_url: string | null;
  graph_svg_url: string | null;
}

/**
 * SSE event payload for job status updates
 */
export interface JobStatusEvent {
  type: 'status' | 'progress' | 'complete' | 'error' | 'heartbeat';
  job_id: string;
  status: JobStatus;
  progress_percent: number;
  message: string;
  error?: string;
  timestamp: string;
  /**
   * Algorithm currently being trained, if the backend reports it. When absent
   * it is inferred from `message`.
   */
  current_algorithm?: string;
  /** Algorithms already finished, if the backend reports them. */
  completed_algorithms?: string[];
}

/**
 * A single human-readable line in the live activity log shown under the
 * progress bar.
 */
export interface JobActivityEntry {
  /** Monotonic id, unique within one job stream. */
  id: number;
  /** ISO timestamp of the originating event. */
  timestamp: string;
  /** Progress at the time of the event, when the event carried one. */
  progress_percent: number | null;
  /** Human-readable description of what happened. */
  text: string;
  level: 'info' | 'success' | 'error';
}

/**
 * Training progress for a single algorithm in the run.
 */
export interface AlgorithmProgress {
  /** snake_case identifier, e.g. `random_forest`. */
  key: string;
  /** Display label, e.g. `Random Forest`. */
  label: string;
  state: 'running' | 'completed' | 'failed';
}

/**
 * Job status state for the useJobStatus hook
 */
export interface JobStatusState {
  job: Job | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Helper to check if a job is in a terminal state
 */
export function isJobComplete(status: JobStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

/**
 * Helper to check if a job is actively running
 */
export function isJobRunning(status: JobStatus): boolean {
  return status === 'pending' || status === 'queued' || status === 'running';
}
