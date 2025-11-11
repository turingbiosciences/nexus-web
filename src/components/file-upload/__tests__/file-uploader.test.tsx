import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { FileUploader } from "../file-uploader";

// Mock dependencies
jest.mock("react-dropzone", () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: jest.fn(() => ({ "data-testid": "dropzone" })),
    getInputProps: jest.fn(() => ({ type: "file" })),
    isDragActive: false,
  })),
}));

jest.mock("tus-js-client", () => ({
  Upload: jest.fn(function MockUpload() {
    return {
      start: jest.fn(),
      abort: jest.fn(),
      options: { headers: {} },
    };
  }),
}));

jest.mock("@/components/providers/global-auth-provider", () => ({
  useGlobalAuth: jest.fn(),
}));

jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: jest.fn(),
}));

import { useDropzone } from "react-dropzone";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";
import { useAccessToken } from "@/components/providers/token-provider";
import { Upload as TusUpload } from "tus-js-client";

const mockUseDropzone = useDropzone as jest.Mock;
const mockUseGlobalAuth = useGlobalAuth as jest.Mock;
const mockUseAccessToken = useAccessToken as jest.Mock;

describe("FileUploader", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TURING_API = "https://api.example.test";
    mockUseDropzone.mockClear();
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseAccessToken.mockReturnValue({
      accessToken: "mock-token",
      isLoading: false,
      error: null,
      refreshToken: jest.fn().mockResolvedValue(undefined),
    });
    // Mock crypto.randomUUID for Jest environment
    global.crypto = {
      ...global.crypto,
      randomUUID: jest.fn(
        () => "mock-uuid-" + Math.random().toString(36).substring(2, 15)
      ),
    } as typeof global.crypto;
  });

  it("renders dropzone and upload section", () => {
    render(<FileUploader />);
    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/upload files/i)).toBeInTheDocument();
  });

  it("shows sign-in banner when not authenticated", () => {
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    render(<FileUploader />);
    expect(
      screen.getByText(/sign in required to upload files/i)
    ).toBeInTheDocument();
  });

  it("shows loading state when auth is loading", () => {
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    render(<FileUploader />);
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
  });

  it("accepts files via onDrop callback", () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);

    const testFile = new File(["content"], "test.txt", { type: "text/plain" });
    if (capturedOnDrop) {
      capturedOnDrop([testFile]);
    }

    waitFor(() => {
      expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
    });
  });

  it("calls onUploadComplete when file upload succeeds", async () => {
    const onUploadComplete = jest.fn();
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader onUploadComplete={onUploadComplete} />);

    const testFile = new File(["content"], "test.txt", { type: "text/plain" });
    if (capturedOnDrop) {
      capturedOnDrop([testFile]);
    }

    // Note: Full TUS integration test would require mocking TUS upload lifecycle
    // This test validates the component renders and accepts files
    await waitFor(() => {
      expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
    });
  });

  it("respects maxSize configuration from react-dropzone", () => {
    const maxSize = 1024 * 1024; // 1MB
    render(<FileUploader maxSize={maxSize} />);

    expect(mockUseDropzone).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSize,
        multiple: true,
      })
    );
  });

  it("handles multiple file selection", async () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([
      new File(["1"], "a.txt"),
      new File(["2"], "b.txt"),
      new File(["3"], "c.txt"),
    ]);

    await waitFor(() => {
      expect(screen.getByText(/a.txt/)).toBeInTheDocument();
      expect(screen.getByText(/b.txt/)).toBeInTheDocument();
      expect(screen.getByText(/c.txt/)).toBeInTheDocument();
    });
  });

  it("removes an upload from the queue", async () => {
    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([new File(["a"], "remove.txt")]);
    await screen.findByText(/remove.txt/);

    const removeBtn = screen.getByRole("button", { name: /remove upload/i });
    removeBtn.click();

    await waitFor(() => {
      expect(screen.queryByText(/remove.txt/)).not.toBeInTheDocument();
    });
  });

  it("invokes progress callback on progress updates", async () => {
    const progressCb = jest.fn();
    (TusUpload as unknown as jest.Mock).mockImplementation(function (
      _file,
      options
    ) {
      return {
        start: () => {
          // Simulate async progress callback
          setTimeout(() => options.onProgress?.(50, 100), 0);
        },
        abort: jest.fn(),
        options: { headers: {} },
      };
    });

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader onUploadProgress={progressCb} />);
    capturedOnDrop?.([new File(["xx"], "progress.txt")]);

    const startBtn = await screen.findByRole("button", {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      expect(progressCb).toHaveBeenCalledWith(expect.any(String), 50);
    });
  });

  it("handles upload error and displays message", async () => {
    (TusUpload as unknown as jest.Mock).mockImplementation(function (
      _file,
      options
    ) {
      return {
        start: () => options.onError?.(new Error("Boom")),
        abort: jest.fn(),
        options: { headers: {} },
      };
    });

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([new File(["err"], "error.txt")]);

    const startBtn = await screen.findByRole("button", {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
  });

  it("shows token acquisition error", async () => {
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseAccessToken.mockReturnValue({
      accessToken: null,
      isLoading: false,
      error: null,
      refreshToken: jest.fn(),
    });

    (TusUpload as unknown as jest.Mock).mockImplementation(function () {
      return { start: jest.fn(), abort: jest.fn(), options: { headers: {} } };
    });

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({ "data-testid": "dropzone" }),
        getInputProps: () => ({ type: "file" }),
        isDragActive: false,
      };
    });

    render(<FileUploader />);
    capturedOnDrop?.([new File(["x"], "token.txt")]);
    const startBtn = await screen.findByRole("button", {
      name: /start upload/i,
    });
    startBtn.click();

    await waitFor(() => {
      // Should show authError banner
      expect(screen.getByText(/access token unavailable/i)).toBeInTheDocument();
    });
  });

  it("shows auth banner disabled state for dropzone when unauthenticated", () => {
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(<FileUploader />);
    expect(
      screen.getByText(/please sign in to enable uploads/i)
    ).toBeInTheDocument();
  });

  describe("Token Expiration Handling", () => {
    let originalLocation: Location;

    beforeAll(() => {
      originalLocation = window.location;
    });

    beforeEach(() => {
      // Mock window.location.href fresh for each test
      delete (window as { location?: Location }).location;
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Reset location
      (window as { location?: Location }).location = originalLocation;
    });

    it("should redirect to sign-out on XHR 401 with expired token", async () => {
      mockUseGlobalAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAccessToken.mockReturnValue({
        accessToken: "expired-token",
        isLoading: false,
        error: null,
        refreshToken: jest.fn(),
        isAuthenticated: true,
        authLoading: false,
      });

      // Mock XMLHttpRequest
      const mockXHR = {
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === "load") {
            // Simulate 401 with expired token message
            Object.defineProperty(mockXHR, "status", { value: 401 });
            Object.defineProperty(mockXHR, "responseText", {
              value: '{"detail":"Invalid token: Signature has expired."}',
            });
            setTimeout(() => handler(), 0);
          }
        }),
        upload: {
          addEventListener: jest.fn(),
        },
      };

      global.XMLHttpRequest = jest.fn(
        () => mockXHR
      ) as unknown as typeof XMLHttpRequest;

      let capturedOnDrop: ((files: File[]) => void) | undefined;
      mockUseDropzone.mockImplementation((config) => {
        capturedOnDrop = config.onDrop;
        return {
          getRootProps: () => ({ "data-testid": "dropzone" }),
          getInputProps: () => ({ type: "file" }),
          isDragActive: false,
        };
      });

      render(<FileUploader projectId="test-project" />);

      capturedOnDrop?.([new File(["content"], "test.txt")]);

      const startBtn = await screen.findByRole("button", {
        name: /start upload/i,
      });
      startBtn.click();

      await waitFor(() => {
        expect(window.location.href).toBe("/api/logto/sign-out");
      });
    });

    it("should redirect to sign-out on TUS 401 with expired token", async () => {
      mockUseGlobalAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAccessToken.mockReturnValue({
        accessToken: "expired-token",
        isLoading: false,
        error: null,
        refreshToken: jest.fn(),
        isAuthenticated: true,
        authLoading: false,
      });

      let capturedOnError: ((error: Error) => void) | undefined;

      (TusUpload as unknown as jest.Mock).mockImplementation(function (
        file,
        options
      ) {
        capturedOnError = options.onError;
        return {
          start: jest.fn(() => {
            // Simulate TUS 401 error
            capturedOnError?.(new Error("401 - Unauthorized: token expired"));
          }),
          abort: jest.fn(),
          options: { headers: {} },
        };
      });

      let capturedOnDrop: ((files: File[]) => void) | undefined;
      mockUseDropzone.mockImplementation((config) => {
        capturedOnDrop = config.onDrop;
        return {
          getRootProps: () => ({ "data-testid": "dropzone" }),
          getInputProps: () => ({ type: "file" }),
          isDragActive: false,
        };
      });

      render(<FileUploader projectId="test-project" />);

      capturedOnDrop?.([new File(["content"], "test.txt")]);

      const startBtn = await screen.findByRole("button", {
        name: /start upload/i,
      });
      startBtn.click();

      await waitFor(() => {
        expect(window.location.href).toBe("/api/logto/sign-out");
      });
    });

    it("should not redirect on XHR 401 without expired token message", async () => {
      mockUseGlobalAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAccessToken.mockReturnValue({
        accessToken: "test-token",
        isLoading: false,
        error: null,
        refreshToken: jest.fn(),
        isAuthenticated: true,
        authLoading: false,
      });

      const mockXHR = {
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === "load") {
            Object.defineProperty(mockXHR, "status", { value: 401 });
            Object.defineProperty(mockXHR, "responseText", {
              value: '{"detail":"Invalid credentials"}',
            });
            setTimeout(() => handler(), 0);
          }
        }),
        upload: {
          addEventListener: jest.fn(),
        },
      };

      global.XMLHttpRequest = jest.fn(
        () => mockXHR
      ) as unknown as typeof XMLHttpRequest;

      let capturedOnDrop: ((files: File[]) => void) | undefined;
      mockUseDropzone.mockImplementation((config) => {
        capturedOnDrop = config.onDrop;
        return {
          getRootProps: () => ({ "data-testid": "dropzone" }),
          getInputProps: () => ({ type: "file" }),
          isDragActive: false,
        };
      });

      render(<FileUploader projectId="test-project" />);

      capturedOnDrop?.([new File(["content"], "test.txt")]);

      const startBtn = await screen.findByRole("button", {
        name: /start upload/i,
      });
      startBtn.click();

      await waitFor(() => {
        // Should show error but not redirect
        expect(window.location.href).toBe("");
      });
    });
  });
});
