/**
 * Shared test mock components and setup functions
 * Provides reusable mocks to reduce duplication across test files
 */

import React from 'react';

/**
 * Mock Modal component for testing modal-based components
 * Use with jest.mock('@/components/ui/modal', () => require('@/lib/test-mocks').modalMock)
 */

export const MockModal = ({
  isOpen,
  onClose: _onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) =>
  isOpen ? (
    <div data-testid="modal" role="dialog">
      <h2>{title}</h2>
      <button onClick={_onClose}>Close</button>
      {children}
    </div>
  ) : null;

/**
 * Pre-configured modal mock for jest.mock()
 * Usage: jest.mock('@/components/ui/modal', () => require('@/lib/test-mocks').modalMock)
 */
export const modalMock = {
  Modal: MockModal,
};

/**
 * Creates a mock return value for useQuery hook
 * Includes all required properties to satisfy UseQueryResult type
 */
export function createMockUseQueryReturn<T>(overrides?: {
  data?: T;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  refetch?: jest.Mock;
  isFetching?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
}) {
  const isLoading = overrides?.isLoading ?? false;
  const isError = overrides?.isError ?? false;
  const isPending = overrides?.isPending ?? isLoading;
  const isSuccess = overrides?.isSuccess ?? (!isLoading && !isError);

  return {
    data: undefined as T | undefined,
    isLoading,
    isError,
    error: null as Error | null,
    refetch: jest.fn(),
    isFetching: false,
    isPending,
    isSuccess,
    isLoadingError: false,
    isRefetchError: false,
    status: isLoading ? 'pending' : isError ? 'error' : ('success' as const),
    fetchStatus: 'idle' as const,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isStale: false,
    isPlaceholderData: false,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isRefetching: false,
    isInitialLoading: isLoading,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve() as Promise<T>,
    ...overrides,
  };
}

/**
 * Creates a loading state for useQuery mock
 */
export function createLoadingQueryReturn<T>() {
  return createMockUseQueryReturn<T>({
    data: undefined,
    isLoading: true,
    isPending: true,
    isSuccess: false,
  });
}

/**
 * Creates an error state for useQuery mock
 */
export function createErrorQueryReturn<T>(error: Error | string) {
  return createMockUseQueryReturn<T>({
    data: undefined,
    isLoading: false,
    isError: true,
    error: typeof error === 'string' ? new Error(error) : error,
    isSuccess: false,
  });
}

/**
 * Creates a success state for useQuery mock
 */
export function createSuccessQueryReturn<T>(data: T) {
  return createMockUseQueryReturn<T>({
    data,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
  });
}

/**
 * Sets up common test environment
 * Call in beforeEach
 *
 * No API URL is configured any more: the browser calls the same-origin
 * /api/turing/* proxy, so getApiBaseUrl() returns a fixed path and reads no
 * environment variable.
 */
export function setupTestEnv() {
  jest.clearAllMocks();
}

/**
 * Cleans up test environment
 * Call in afterEach
 */
export function cleanupTestEnv() {
  jest.restoreAllMocks();
}

/**
 * Creates a mock for the useAccessToken hook
 * For use in tests that need to mock the token provider
 */
export function createAccessTokenMock(overrides?: {
  accessToken?: string | null;
  isLoading?: boolean;
  error?: Error | null;
  isAuthenticated?: boolean;
  authLoading?: boolean;
}) {
  return {
    accessToken: 'mock-token',
    isLoading: false,
    error: null,
    refreshToken: jest.fn().mockResolvedValue('new-token'),
    isAuthenticated: true,
    authLoading: false,
    ...overrides,
  };
}

/**
 * Creates a mock for unauthenticated state
 */
export function createUnauthenticatedMock() {
  return createAccessTokenMock({
    accessToken: null,
    isAuthenticated: false,
  });
}
