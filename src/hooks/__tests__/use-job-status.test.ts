/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobStatus } from '../use-job-status';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the API base URL
jest.mock('@/lib/api/get-api-base', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
}));

describe('useJobStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state when disabled', () => {
      const { result } = renderHook(() =>
        useJobStatus(null, null, {
          enabled: false,
        })
      );

      expect(result.current.job).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not connect without projectId', () => {
      const { result } = renderHook(() =>
        useJobStatus(null, 'job-123', {
          enabled: true,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not connect without jobId', () => {
      const { result } = renderHook(() =>
        useJobStatus('project-123', null, {
          enabled: true,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('mock mode', () => {
    it('should simulate progress in mock mode', async () => {
      const onComplete = jest.fn();

      const { result } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          enabled: true,
          useMock: true,
          onComplete,
        })
      );

      // Should start connected in mock mode
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should have initial job state
      expect(result.current.job).not.toBeNull();
      expect(result.current.job?.status).toBe('pending');
      expect(result.current.job?.progress_percent).toBe(0);
    });

    it('should provide disconnect function', () => {
      const { result } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          enabled: true,
          useMock: true,
        })
      );

      expect(typeof result.current.disconnect).toBe('function');

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('activity log and algorithms', () => {
    it('should seed the activity log with the initial message', async () => {
      const { result } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          enabled: true,
          useMock: true,
        })
      );

      await waitFor(() => {
        expect(result.current.activity).toHaveLength(1);
      });

      expect(result.current.activity[0].text).toBe(
        'Initializing training job...'
      );
      expect(result.current.activity[0].progress_percent).toBe(0);
      expect(result.current.algorithms).toEqual([]);
    });

    it('should accumulate activity lines and algorithms as progress arrives', async () => {
      jest.useFakeTimers();

      try {
        const { result } = renderHook(() =>
          useJobStatus('project-123', 'job-123', {
            enabled: true,
            useMock: true,
          })
        );

        // Three mock ticks: "Loading dataset...", "Preprocessing data...",
        // "Training Random Forest...".
        act(() => {
          jest.advanceTimersByTime(6000);
        });

        const texts = result.current.activity.map((entry) => entry.text);
        expect(texts).toEqual([
          'Initializing training job...',
          'Loading dataset...',
          'Preprocessing data...',
          'Training Random Forest...',
        ]);
        expect(result.current.algorithms).toEqual([
          {
            key: 'random_forest',
            label: 'Random Forest',
            state: 'running',
            progress: null,
          },
        ]);

        // Next tick starts Gradient Boosting, so Random Forest is done.
        act(() => {
          jest.advanceTimersByTime(2000);
        });

        expect(result.current.algorithms[0]).toEqual({
          key: 'random_forest',
          label: 'Random Forest',
          state: 'completed',
          progress: null,
        });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('cleanup', () => {
    it('should disconnect on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          enabled: true,
          useMock: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      // Connection should be cleaned up (no way to directly test this without mocking EventSource)
    });
  });
});
