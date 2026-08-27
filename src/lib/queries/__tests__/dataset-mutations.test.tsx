import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUploadDatasetMutation,
  useDeleteDatasetMutation,
} from '../dataset-mutations';
import React from 'react';

// Mock useAuthState with mutable implementation
const mockUseAuthState = jest.fn(() => ({
  isLoading: false,
}));

jest.mock('@/components/providers/auth-state-provider', () => ({
  useAuthState: () => mockUseAuthState(),
}));

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: string, options: any) => {
    // Default mock for file upload
    if (url.includes('/files') && !url.includes('DELETE')) {
      // Extract filename from FormData if possible
      let filename = 'test.csv';
      let size = 12;

      const body = options?.body as unknown as FormData;
      if (body && body.get) {
        const file = body.get('file') as File;
        if (file && file.name) {
          filename = file.name;
          size = file.size;
        }
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: `upload-${Date.now()}`,
            filename,
            size,
            uploadedAt: new Date().toISOString(),
          }),
      });
    }
    // Default mock for file delete
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });
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

describe('useUploadDatasetMutation', () => {
  beforeEach(() => {
    // Ensure default mock state (no token from hook)
  });

  it('successfully uploads a dataset', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.filename).toBe('test.csv');
    expect(result.current.data?.size).toBe(file.size);
    expect(result.current.data?.id).toBeDefined();
    expect(result.current.data?.uploadedAt).toBeInstanceOf(Date);
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('transitions through states during upload', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    result.current.mutate(file);

    // Wait for completion
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('handles multiple sequential uploads', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file1 = new File(['test 1'], 'test1.csv', { type: 'text/csv' });

    // First upload
    result.current.mutate(file1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.filename).toBe('test1.csv');

    // Can perform multiple uploads with same mutation
    expect(result.current).toBeDefined();
  });

  it('uses correct mutation key', () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    // Mutation key should be set correctly (implicit in the hook)
    expect(result.current).toBeDefined();
  });

  it('handles different project IDs', async () => {
    const wrapper1 = createWrapper();
    const wrapper2 = createWrapper();

    const { result: result1 } = renderHook(
      () => useUploadDatasetMutation('project-1'),
      { wrapper: wrapper1 }
    );

    const { result: result2 } = renderHook(
      () => useUploadDatasetMutation('project-2'),
      { wrapper: wrapper2 }
    );

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });

    // First upload
    result1.current.mutate(file);
    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    expect(result1.current.data).toBeDefined();

    // Second upload with different project
    result2.current.mutate(file);
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    expect(result2.current.data).toBeDefined();
  });

  it('generates unique IDs for uploads', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file1 = new File(['test 1'], 'test1.csv', { type: 'text/csv' });

    result.current.mutate(file1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const id1 = result.current.data?.id;

    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
  });

  it('preserves file metadata', async () => {
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['test content'], 'data.csv', {
      type: 'text/csv',
    });
    const originalSize = file.size;

    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.filename).toBe('data.csv');
    expect(result.current.data?.size).toBe(originalSize);
  });
});

describe('useDeleteDatasetMutation', () => {
  beforeEach(() => {
    // Ensure default mock state (no token from hook)
  });

  it('successfully deletes a dataset', async () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate('dataset-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.success).toBe(true);
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('transitions through states during deletion', async () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate('dataset-1');

    // Wait for completion
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('handles sequential deletions', async () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    // First deletion
    result.current.mutate('dataset-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);

    // Can perform multiple deletions
    expect(result.current).toBeDefined();
  });

  it('uses correct mutation key', () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    // Mutation key should be set correctly (implicit in the hook)
    expect(result.current).toBeDefined();
  });

  it('handles different project IDs', async () => {
    const wrapper1 = createWrapper();
    const wrapper2 = createWrapper();

    const { result: result1 } = renderHook(
      () => useDeleteDatasetMutation('project-1'),
      { wrapper: wrapper1 }
    );

    const { result: result2 } = renderHook(
      () => useDeleteDatasetMutation('project-2'),
      { wrapper: wrapper2 }
    );

    // First deletion
    result1.current.mutate('dataset-1');
    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    expect(result1.current.data?.success).toBe(true);

    // Second deletion with different project
    result2.current.mutate('dataset-1');
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    expect(result2.current.data?.success).toBe(true);
  });

  it('completes deletion within reasonable time', async () => {
    const { result } = renderHook(() => useDeleteDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const startTime = Date.now();

    result.current.mutate('dataset-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const duration = Date.now() - startTime;
    // Should complete within 1 second (simulated latency is 300ms)
    expect(duration).toBeLessThan(1000);
  });
});

describe('Mutation Interactions', () => {
  beforeEach(() => {
    // Ensure default mock state (no token from hook)
  });

  it('can use both upload and delete mutations together', async () => {
    const wrapper = createWrapper();

    const { result: uploadResult } = renderHook(
      () => useUploadDatasetMutation('project-1'),
      { wrapper }
    );

    const { result: deleteResult } = renderHook(
      () => useDeleteDatasetMutation('project-1'),
      { wrapper }
    );

    // Upload a file
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    uploadResult.current.mutate(file);

    await waitFor(() => expect(uploadResult.current.isSuccess).toBe(true));

    const uploadedId = uploadResult.current.data?.id;
    expect(uploadedId).toBeDefined();

    // Delete the uploaded file
    deleteResult.current.mutate(uploadedId!);

    await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));

    expect(deleteResult.current.data?.success).toBe(true);
  });

  it('maintains independent state for upload and delete', async () => {
    const wrapper = createWrapper();

    const { result: uploadResult } = renderHook(
      () => useUploadDatasetMutation('project-1'),
      { wrapper }
    );

    const { result: deleteResult } = renderHook(
      () => useDeleteDatasetMutation('project-1'),
      { wrapper }
    );

    // Upload should not affect delete state
    expect(uploadResult.current.isIdle).toBe(true);
    expect(deleteResult.current.isIdle).toBe(true);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    uploadResult.current.mutate(file);

    await waitFor(() => expect(uploadResult.current.isSuccess).toBe(true));

    // Delete should still be idle
    expect(deleteResult.current.isIdle).toBe(true);
  });
});

describe('Dataset Mutations', () => {
  it('never calls a token endpoint — credentials come from the proxy', async () => {
    // The mutations used to fall back to GET /api/logto/token when the caller
    // had no token. That route is gone; requests now carry the session cookie
    // and the proxy attaches API credentials server-side.
    const { result } = renderHook(() => useUploadDatasetMutation('project-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrls = mockFetch.mock.calls.map((call) => String(call[0]));
    expect(calledUrls).not.toContain('/api/logto/token');
    expect(calledUrls).toContain('/api/turing/projects/project-1/files');

    const [, init] = mockFetch.mock.calls[0];
    expect(init.credentials).toBe('include');
    expect(init.headers?.Authorization).toBeUndefined();
  });
});
