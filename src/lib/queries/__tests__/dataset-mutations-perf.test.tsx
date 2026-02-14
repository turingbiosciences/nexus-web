import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadDatasetMutation } from '../dataset-mutations';
import React from 'react';

// Mock useAccessToken to provide a token (simulating optimized behavior)
jest.mock('@/components/providers/token-provider', () => ({
  useAccessToken: () => ({
    accessToken: 'test-token-from-hook',
    isLoading: false,
  }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_TURING_API: 'http://localhost:8000',
  };
  mockFetch.mockReset();

  // Default mock behavior
  mockFetch.mockImplementation((url: string, options: any) => {
    if (url === '/api/logto/token') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'test-token-from-fetch' }),
      });
    }

    // Default mock for file upload
    if (url.includes('/files') && !url.includes('DELETE')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: `upload-${Date.now()}`,
            filename: 'test.csv',
            size: 100,
            uploadedAt: new Date().toISOString(),
          }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });
});

afterEach(() => {
  process.env = originalEnv;
});

// Test wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('Dataset Mutation Performance', () => {
  it('skips token fetch when token is available from hook (optimized behavior)', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check calls to /api/logto/token
    const tokenCalls = mockFetch.mock.calls.filter(
      (call) => call[0] === '/api/logto/token'
    );

    // Should NOT fetch token as it is provided by the hook
    expect(tokenCalls.length).toBe(0);
  });
});
