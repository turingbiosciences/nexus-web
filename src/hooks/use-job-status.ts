'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Job, JobStatus, JobStatusEvent, isJobComplete } from '@/types/job';
import { getApiBaseUrl } from '@/lib/api/get-api-base';
import { logger } from '@/lib/logger';

interface UseJobStatusOptions {
  /** Access token for authentication */
  accessToken: string | null;
  /** Enable/disable the SSE connection */
  enabled?: boolean;
  /** Callback when job completes successfully */
  onComplete?: (job: Job) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
  /** Use mock data for development */
  useMock?: boolean;
}

interface UseJobStatusReturn {
  /** Current job state */
  job: Job | null;
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Whether initial connection is loading */
  isLoading: boolean;
  /** Current error message */
  error: string | null;
  /** Disconnect from SSE stream */
  disconnect: () => void;
}

// Reconnection configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const MAX_RETRIES = 5;

/**
 * Hook for subscribing to real-time job status updates via SSE
 *
 * @example
 * ```tsx
 * const { job, isConnected, error } = useJobStatus(projectId, jobId, {
 *   accessToken,
 *   onComplete: (job) => console.log("Job completed:", job),
 *   onError: (error) => console.error("Job failed:", error),
 * });
 * ```
 */
export function useJobStatus(
  projectId: string | null,
  jobId: string | null,
  options: UseJobStatusOptions
): UseJobStatusReturn {
  const {
    accessToken,
    enabled = true,
    onComplete,
    onError,
    useMock = false,
  } = options;

  const [job, setJob] = useState<Job | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Incrementing this triggers the effect to open a fresh EventSource (reconnect).
  const [retryKey, setRetryKey] = useState(0);
  // Track previous jobId so we only reset state on job change, not on retries.
  const prevJobIdRef = useRef<string | null>(null);

  // Use refs for callbacks to avoid dependency cycles
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Keep callback refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobRef = useRef<Job | null>(null);

  // Keep job ref in sync
  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Handle incoming SSE events
  const handleEvent = useCallback(
    (event: MessageEvent) => {
      try {
        const eventType = event.type || 'message';
        const data = JSON.parse(event.data);

        // Upgrade to info level for easier debugging as requested
        logger.info({ eventType, data }, 'SSE event received');

        if (eventType === 'heartbeat' || eventType === 'connected') {
          return;
        }

        if (eventType === 'error') {
          const errorMessage = data.error || 'Unknown streaming error';
          setError(errorMessage);
          onErrorRef.current?.(errorMessage);
          setJob((prev) =>
            prev
              ? { ...prev, status: 'failed' as JobStatus, error: errorMessage }
              : null
          );
          return;
        }

        const jobData = data as JobStatusEvent;

        // Update job state based on event
        setJob((prev) => {
          // BUG FIX: If prev is null, we should initialize it from the event data
          if (!prev) {
            if (!projectId) {
              const errorMessage =
                'Missing projectId while processing job status event';
              logger.error(
                { jobId: jobData.job_id, eventData: jobData },
                errorMessage
              );
              setError(errorMessage);
              onErrorRef.current?.(errorMessage);
              return prev;
            }

            return {
              job_id: jobData.job_id,
              project_id: projectId,
              status: jobData.status,
              progress_percent: jobData.progress_percent,
              message: jobData.message,
              error: jobData.error || null,
              created_at: jobData.timestamp || new Date().toISOString(),
              completed_at: null,
              best_model: null,
              metrics: null,
              models_trained: null,
              feature_importance: null,
              results_csv_url: null,
              graph_svg_url: null,
            } as Job;
          }

          const updated = {
            ...prev,
            status: jobData.status,
            progress_percent: jobData.progress_percent,
            message: jobData.message,
            error: jobData.error || null,
          };
          return updated;
        });

        // Handle completion
        if (jobData.type === 'complete' && isJobComplete(jobData.status)) {
          if (jobData.status === 'completed') {
            const currentJob = jobRef.current;
            if (currentJob) {
              onCompleteRef.current?.(currentJob);
            }
          } else if (jobData.status === 'failed') {
            onErrorRef.current?.(jobData.error || 'Job failed');
          }
          // Close the EventSource after a terminal event so the server-side
          // connection close does not trigger a spurious onerror → retry chain.
          disconnect();
        }
      } catch (err) {
        logger.error(
          { error: err, eventData: event.data },
          'Failed to parse SSE event'
        );
      }
    },
    [projectId, disconnect]
  );

  // Mock SSE for development/testing
  const startMockSSE = useCallback((pId: string, jId: string) => {
    setIsLoading(true);
    setError(null);

    // Initialize mock job
    const mockJob: Job = {
      job_id: jId,
      project_id: pId,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
      progress_percent: 0,
      message: 'Initializing training job...',
      error: null,
      best_model: null,
      metrics: null,
      models_trained: null,
      feature_importance: null,
      results_csv_url: null,
      graph_svg_url: null,
    };
    setJob(mockJob);
    jobRef.current = mockJob;
    setIsLoading(false);
    setIsConnected(true);

    // Simulate progress updates
    let progress = 0;
    const messages = [
      'Loading dataset...',
      'Preprocessing data...',
      'Training Random Forest...',
      'Training Gradient Boosting...',
      'Training XGBoost...',
      'Evaluating models...',
      'Selecting best model...',
      'Generating feature importance...',
      'Finalizing results...',
      'Training complete!',
    ];

    mockIntervalRef.current = setInterval(() => {
      progress += 10;
      const messageIndex = Math.min(
        Math.floor(progress / 10) - 1,
        messages.length - 1
      );

      if (progress >= 100) {
        const completedJob: Job = {
          ...mockJob,
          status: 'completed' as JobStatus,
          progress_percent: 100,
          message: 'Training complete!',
          completed_at: new Date().toISOString(),
          best_model: 'XGBoost',
          metrics: { accuracy: 0.92, f1_score: 0.89 },
          models_trained: 5,
        };
        setJob(completedJob);
        jobRef.current = completedJob;

        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current);
          mockIntervalRef.current = null;
        }
        setIsConnected(false);
        onCompleteRef.current?.(completedJob);
      } else {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: 'running' as JobStatus,
                progress_percent: progress,
                message: messages[messageIndex] || 'Processing...',
              }
            : null
        );
      }
    }, 2000); // Update every 2 seconds for demo
  }, []);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (!enabled || !projectId || !jobId || !accessToken) {
      return;
    }

    // Reset job state and retry count only when switching to a different job,
    // not when reconnecting after a transient drop (retryKey change).
    if (jobId !== prevJobIdRef.current) {
      setJob(null);
      retryCountRef.current = 0;
      prevJobIdRef.current = jobId;
    }

    if (useMock) {
      startMockSSE(projectId, jobId);
      return () => {
        disconnect();
      };
    }

    // Real SSE connection
    setIsLoading(true);
    setError(null);

    const baseUrl = getApiBaseUrl();
    // Pass token via query string since EventSource doesn't support headers
    const url = `${baseUrl}/projects/${projectId}/training/${jobId}/stream?token=${encodeURIComponent(accessToken)}`;

    logger.info(
      { projectId, jobId, retryKey, retryCount: retryCountRef.current },
      'Connecting to job status SSE stream'
    );

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      logger.info({ projectId, jobId }, 'SSE connection established');
      setIsConnected(true);
      setIsLoading(false);
      // Reset retry count on a successful open so transient drops don't burn retries permanently.
      retryCountRef.current = 0;
    };

    eventSource.onmessage = handleEvent;

    // Explicitly listen for all event types defined in SSE_ENDPOINT_SPEC.md
    eventSource.addEventListener('connected', handleEvent);
    eventSource.addEventListener('heartbeat', handleEvent);
    eventSource.addEventListener('status', handleEvent);
    eventSource.addEventListener('progress', handleEvent);
    eventSource.addEventListener('complete', handleEvent);

    eventSource.addEventListener('error', (event: Event) => {
      if ((event as MessageEvent).data) {
        handleEvent(event as MessageEvent);
      }
    });

    eventSource.onerror = (e) => {
      // If disconnect() was already called (e.g. after a terminal event), the
      // ref is null — skip retry so we don't spuriously reopen the stream.
      if (!eventSourceRef.current) return;

      logger.error({ projectId, jobId, event: e }, 'SSE connection error');
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
          MAX_RETRY_DELAY
        );
        retryCountRef.current++;

        logger.info(
          { retryCount: retryCountRef.current, delay },
          'Scheduling SSE reconnection'
        );

        // Increment retryKey to trigger the effect to open a fresh EventSource.
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          setRetryKey((k) => k + 1);
        }, delay);
      } else {
        setError('Connection lost. Please refresh the page.');
        setIsLoading(false);
        onErrorRef.current?.('Connection lost after maximum retries');
      }
    };

    return () => {
      disconnect();
    };
  }, [
    enabled,
    projectId,
    jobId,
    accessToken,
    useMock,
    startMockSSE,
    handleEvent,
    disconnect,
    retryKey,
  ]);

  return {
    job,
    isConnected,
    isLoading,
    error,
    disconnect,
  };
}
