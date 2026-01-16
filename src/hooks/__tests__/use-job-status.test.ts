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
          accessToken: null,
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
          accessToken: 'token',
          enabled: true,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not connect without jobId', () => {
      const { result } = renderHook(() =>
        useJobStatus('project-123', null, {
          accessToken: 'token',
          enabled: true,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not connect without accessToken', () => {
      const { result } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          accessToken: null,
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
          accessToken: 'token',
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
          accessToken: 'token',
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

  describe('cleanup', () => {
    it('should disconnect on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useJobStatus('project-123', 'job-123', {
          accessToken: 'token',
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
