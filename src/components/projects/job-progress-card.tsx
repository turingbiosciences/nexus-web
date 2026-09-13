'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Job,
  JobActivityEntry,
  AlgorithmProgress,
  isJobRunning,
  isJobComplete,
} from '@/types/job';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Number of log lines visible in the activity box before it scrolls. */
const ACTIVITY_VISIBLE_LINES = 5;
/** Line height of a log line in px; must match the `leading-[18px]` below. */
const ACTIVITY_LINE_HEIGHT = 18;

/**
 * Row of chips showing which algorithms have finished training, so the user
 * gets a quick heads-up on progress without reading the log.
 */
function AlgorithmChips({ algorithms }: { algorithms: AlgorithmProgress[] }) {
  if (algorithms.length === 0) return null;

  const completedCount = algorithms.filter(
    (a) => a.state === 'completed'
  ).length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-500">
        Algorithms ({completedCount}/{algorithms.length} complete):
      </span>
      {algorithms.map((algo) => {
        const styles =
          algo.state === 'completed'
            ? 'bg-green-100 text-green-800 border-green-200'
            : algo.state === 'failed'
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-blue-100 text-blue-800 border-blue-200';

        return (
          <span
            key={algo.key}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
            title={`${algo.label}: ${algo.state}`}
          >
            {algo.state === 'completed' && <Check className="h-3 w-3" />}
            {algo.state === 'failed' && <XCircle className="h-3 w-3" />}
            {algo.state === 'running' && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {algo.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Scrolling, human-readable log of the most recent SSE events.
 *
 * Auto-scrolls to the newest line, unless the user has scrolled up to read
 * back through the history.
 */
function ActivityLog({ entries }: { entries: JobActivityEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // 4px of slack so a sub-pixel scroll position still counts as "at bottom".
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 4;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  if (entries.length === 0) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? '--:--:--'
      : date.toLocaleTimeString([], { hour12: false });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Training activity"
      className="overflow-y-auto rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[11px] leading-[18px]"
      style={{ maxHeight: ACTIVITY_VISIBLE_LINES * ACTIVITY_LINE_HEIGHT + 8 }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex gap-2 whitespace-pre-wrap break-words ${
            entry.level === 'error'
              ? 'text-red-700'
              : entry.level === 'success'
                ? 'text-green-700'
                : 'text-gray-600'
          }`}
        >
          <span className="shrink-0 text-gray-400">
            {formatTimestamp(entry.timestamp)}
          </span>
          {entry.progress_percent !== null && (
            <span className="shrink-0 tabular-nums text-gray-400">
              {entry.progress_percent}%
            </span>
          )}
          <span>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

interface JobProgressCardProps {
  /** Current job state */
  job: Job | null;
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Whether initial connection is loading */
  isLoading: boolean;
  /** Current error message */
  error: string | null;
  /** Human-readable log of recent SSE events, oldest first */
  activity?: JobActivityEntry[];
  /** Per-algorithm training progress derived from the event stream */
  algorithms?: AlgorithmProgress[];
  /** Optional callback to cancel the job */
  onCancel?: () => void;
  /** Optional callback to dismiss the card */
  onDismiss?: () => void;
}

/**
 * Displays real-time job progress with animated progress bar
 */
export function JobProgressCard({
  job,
  isConnected,
  isLoading,
  error,
  activity = [],
  algorithms = [],
  onCancel,
  onDismiss,
}: JobProgressCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second while job is running
  useEffect(() => {
    if (!job || !isJobRunning(job.status)) {
      return;
    }

    const startTime = new Date(job.created_at).getTime();
    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [job]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status-specific styling
  const getStatusConfig = () => {
    if (error) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        progressColor: 'bg-red-500',
      };
    }

    if (!job) {
      return {
        icon: Loader2,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        progressColor: 'bg-gray-400',
      };
    }

    switch (job.status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          progressColor: 'bg-green-500',
        };
      case 'failed':
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          progressColor: 'bg-red-500',
        };
      default:
        return {
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          progressColor: 'bg-blue-500',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const progress = job?.progress_percent ?? 0;
  const isRunning = job ? isJobRunning(job.status) : false;
  const isComplete = job ? isJobComplete(job.status) : false;

  // Loading state
  if (isLoading && !job) {
    return (
      <div className="card border border-gray-200">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Connecting to job stream...</span>
        </div>
      </div>
    );
  }

  // Error state (no job)
  if (error && !job) {
    return (
      <div className="card border border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No job state
  if (!job) {
    return null;
  }

  return (
    <div className={`card border ${config.borderColor} ${config.bgColor}`}>
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon
              className={`h-5 w-5 ${config.color} ${isRunning ? 'animate-pulse' : ''}`}
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {isComplete
                  ? job.status === 'completed'
                    ? 'Training Complete'
                    : 'Training Failed'
                  : 'Training in Progress'}
              </h3>
              <p className="text-sm text-gray-600">{job.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Elapsed time */}
            {isRunning && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            )}

            {/* Connection status indicator */}
            {isRunning && (
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
            )}

            {/* Cancel button */}
            {isRunning && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Cancel
              </Button>
            )}

            {/* Dismiss button for completed jobs */}
            {isComplete && onDismiss && (
              <Button variant="outline" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.progressColor} transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Completed / in-flight algorithms */}
          <AlgorithmChips algorithms={algorithms} />

          {/* Live, human-readable feed of the latest stream events */}
          <ActivityLog entries={activity} />
        </div>

        {/* Error message */}
        {job.error && (
          <div className="p-3 bg-red-100 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{job.error}</p>
          </div>
        )}

        {/* Completion details */}
        {job.status === 'completed' && job.best_model && (
          <div className="pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Best Model:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {job.best_model}
                </span>
              </div>
              {job.models_trained && (
                <div>
                  <span className="text-gray-500">Models Trained:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {job.models_trained}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
