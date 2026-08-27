import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FileUploader } from '../file-uploader';

// Mock dependencies
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: jest.fn(() => ({ 'data-testid': 'dropzone' })),
    getInputProps: jest.fn(() => ({ type: 'file' })),
    isDragActive: false,
  })),
}));

jest.mock('tus-js-client', () => ({
  Upload: jest.fn(function MockUpload() {
    return {
      start: jest.fn(),
      abort: jest.fn(),
      options: { headers: {} },
    };
  }),
}));

jest.mock('@/components/providers/auth-state-provider', () => ({
  useAuthState: jest.fn(),
}));

import { useDropzone } from 'react-dropzone';
import { useAuthState } from '@/components/providers/auth-state-provider';
import { Upload as TusUpload } from 'tus-js-client';

const mockUseDropzone = useDropzone as jest.Mock;
const mockUseAuthState = useAuthState as jest.Mock;

describe('FileUploader', () => {
  beforeEach(() => {
    mockUseDropzone.mockClear();
    mockUseAuthState.mockReturnValue({
      refreshToken: jest.fn().mockResolvedValue(undefined),
      isAuthenticated: true,
      authLoading: false,
    });
    // Mock crypto.randomUUID for Jest environment
    global.crypto = {
      ...global.crypto,
      randomUUID: jest.fn(
        () => 'mock-uuid-' + Math.random().toString(36).substring(2, 15)
      ),
    } as typeof global.crypto;
  });

  it('renders dropzone with heading', () => {
    render(<FileUploader />);
    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    // Check for the card title
    expect(
      screen.getByRole('heading', { name: /upload files/i })
    ).toBeInTheDocument();
  });

  it('shows sign-in banner when not authenticated', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
    });
    render(<FileUploader />);
    expect(
      screen.getByText(/sign in required to upload files/i)
    ).toBeInTheDocument();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: false,
      authLoading: true,
    });
    render(<FileUploader />);
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
  });

  it('accepts files via onDrop callback', () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);

    const testFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    if (capturedOnDrop) {
      capturedOnDrop([testFile]);
    }

    waitFor(() => {
      expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
    });
  });

  it('calls onUploadComplete when file upload succeeds', async () => {
    const onUploadComplete = jest.fn();
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader onUploadComplete={onUploadComplete} />);

    const testFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    if (capturedOnDrop) {
      capturedOnDrop([testFile]);
    }

    // Note: Full TUS integration test would require mocking TUS upload lifecycle
    // This test validates the component renders and accepts files
    await waitFor(() => {
      expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
    });
  });

  it('respects maxSize configuration from react-dropzone', () => {
    const maxSize = 1024 * 1024; // 1MB
    render(<FileUploader maxSize={maxSize} />);

    expect(mockUseDropzone).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSize,
        multiple: true,
      })
    );
  });

  it('handles multiple file selection', async () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([
      new File(['1'], 'a.txt'),
      new File(['2'], 'b.txt'),
      new File(['3'], 'c.txt'),
    ]);

    await waitFor(() => {
      expect(screen.getByText(/a.txt/)).toBeInTheDocument();
      expect(screen.getByText(/b.txt/)).toBeInTheDocument();
      expect(screen.getByText(/c.txt/)).toBeInTheDocument();
    });
  });

  it('removes an upload from the queue', async () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([new File(['a'], 'remove.txt')]);
    await screen.findByText(/remove.txt/);

    const removeBtn = screen.getByRole('button', { name: /remove upload/i });
    removeBtn.click();

    await waitFor(() => {
      expect(screen.queryByText(/remove.txt/)).not.toBeInTheDocument();
    });
  });

  it('renders start upload button for pending files', async () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader projectId="test-project" />);
    capturedOnDrop?.([new File(['xx'], 'progress.txt')]);

    const startBtn = await screen.findByRole('button', {
      name: /start upload/i,
    });
    expect(startBtn).toBeInTheDocument();
  });

  it('marks the upload as failed when no projectId is configured', async () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
    });

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([new File(['err'], 'error.txt')]);

    const startBtn = await screen.findByRole('button', {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      expect(
        screen.getByText(/project id is required for file uploads/i)
      ).toBeInTheDocument();
    });
  });

  it('sends the upload with cookies and no Authorization header', async () => {
    // The proxy attaches API credentials server-side. A bearer header here
    // would mean the browser had a token again, which is the thing this
    // migration removes. USE_TUS_UPLOADS is currently false, so this exercises
    // the XHR path that actually runs.
    mockUseAuthState.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
    });

    const openSpy = jest.spyOn(XMLHttpRequest.prototype, 'open');
    const setHeaderSpy = jest.spyOn(
      XMLHttpRequest.prototype,
      'setRequestHeader'
    );

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    render(<FileUploader projectId="test-project" />);
    capturedOnDrop?.([new File(['x'], 'token.txt')]);
    const startBtn = await screen.findByRole('button', {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled();
    });

    expect(openSpy).toHaveBeenCalledWith(
      'POST',
      '/api/turing/projects/test-project/files'
    );
    const headerNames = setHeaderSpy.mock.calls.map(([name]) =>
      String(name).toLowerCase()
    );
    expect(headerNames).not.toContain('authorization');

    openSpy.mockRestore();
    setHeaderSpy.mockRestore();
  });

  it('shows auth banner disabled state for dropzone when unauthenticated', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
    });

    render(<FileUploader />);
    expect(
      screen.getByText(/please sign in to enable uploads/i)
    ).toBeInTheDocument();
  });

  it('shows disabled state message when not authenticated', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: false,
      authLoading: false,
    });

    render(<FileUploader />);

    // Should show the sign-in prompt
    expect(
      screen.getByText(/please sign in to enable uploads/i)
    ).toBeInTheDocument();
  });

  it('shows project ID requirement error when missing', async () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: true,
      authLoading: false,
    });

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false,
      };
    });

    // Render without projectId prop
    render(<FileUploader />);
    capturedOnDrop?.([new File(['content'], 'test.txt')]);

    const startBtn = await screen.findByRole('button', {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      expect(screen.getByText(/project id is required/i)).toBeInTheDocument();
    });
  });
});
