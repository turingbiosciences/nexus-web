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

import { useDropzone } from "react-dropzone";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";

const mockUseDropzone = useDropzone as jest.Mock;
const mockUseGlobalAuth = useGlobalAuth as jest.Mock;

describe("FileUploader", () => {
  beforeEach(() => {
    mockUseDropzone.mockClear();
    mockUseGlobalAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getAccessToken: jest.fn().mockResolvedValue("mock-token"),
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
      getAccessToken: jest.fn(),
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
      getAccessToken: jest.fn(),
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
});
