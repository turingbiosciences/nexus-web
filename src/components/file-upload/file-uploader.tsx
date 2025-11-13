"use client";

import { useCallback, useState, useEffect, memo } from "react";
import { useDropzone } from "react-dropzone";
import * as tus from "tus-js-client";
import { Upload, X, CheckCircle, AlertCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes, formatUploadProgress } from "@/lib/utils";
import { useAccessToken } from "@/components/providers/token-provider";
import { logger } from "@/lib/logger";

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  error?: string;
  xhr?: XMLHttpRequest;
  tusUpload?: tus.Upload;
  uploadMethod?: "tus" | "xhr"; // Track which method is being used
}

interface FileUploaderProps {
  projectId?: string;
  maxSize?: number;
  onUploadComplete?: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
}

export function FileUploader({
  projectId,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
  onUploadComplete,
  onUploadProgress,
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);
  const { isAuthenticated, authLoading, accessToken } = useAccessToken();
  const [authError, setAuthError] = useState<string | null>(null);
  const resource = process.env.NEXT_PUBLIC_TURING_API;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const newUploads: FileUploadItem[] = acceptedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: "pending",
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
      "video/*": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
      "text/*": [".txt", ".csv", ".json", ".xml"],
      "application/*": [".zip", ".rar", ".7z", ".tar", ".gz"],
    },
  });

  const startUploadWithXHR = async (
    upload: FileUploadItem,
    currentAccessToken: string,
    currentProjectId: string
  ) => {
    const apiEndpoint = resource!;

    // Use standard FormData upload (fallback method)
    const formData = new FormData();
    formData.append("file", upload.file);

    const xhr = new XMLHttpRequest();

    // Track progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, progress: percentage } : u
          )
        );
        onUploadProgress?.(upload.id, percentage);
      }
    });

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "completed", progress: 100 }
              : u
          )
        );
        onUploadComplete?.([upload.file]);
      } else if (xhr.status === 401) {
        // Check if token expired
        const errorText = xhr.responseText;
        const isTokenExpired =
          errorText.includes("Signature has expired") ||
          errorText.includes("token expired") ||
          errorText.includes("Invalid token");

        if (isTokenExpired) {
          logger.error(
            { uploadId: upload.id },
            "Upload failed: Token expired, redirecting to sign out"
          );
          window.location.href = "/api/logto/sign-out";
          return;
        }

        const errorMsg = errorText || `Upload failed with status ${xhr.status}`;
        logger.error(
          { uploadId: upload.id, status: xhr.status, errorMsg },
          "XHR upload error"
        );
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: "error",
                  error: "Authentication expired. Please sign in again.",
                }
              : u
          )
        );
      } else {
        const errorMsg =
          xhr.responseText || `Upload failed with status ${xhr.status}`;
        logger.error(
          { uploadId: upload.id, status: xhr.status, errorMsg },
          "XHR upload error"
        );
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: "error",
                  error: errorMsg,
                }
              : u
          )
        );
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      logger.error({ uploadId: upload.id }, "XHR upload network error");
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? {
                ...u,
                status: "error",
                error: "Network error during upload",
              }
            : u
        )
      );
    });

    // Handle abort
    xhr.addEventListener("abort", () => {
      setUploads((prev) =>
        prev.map((u) => (u.id === upload.id ? { ...u, status: "paused" } : u))
      );
    });

    // Store XHR instance and method for pause/resume functionality
    setUploads((prev) =>
      prev.map((u) =>
        u.id === upload.id ? { ...u, xhr, uploadMethod: "xhr" } : u
      )
    );

    // Start the upload
    xhr.open("POST", `${apiEndpoint}/projects/${currentProjectId}/files`);
    xhr.setRequestHeader("Authorization", `Bearer ${currentAccessToken}`);
    xhr.send(formData);
  };

  const startUpload = async (upload: FileUploadItem) => {
    // Block if auth not ready; don't mutate upload status yet
    if (authLoading) {
      setAuthError("Authentication loading. Please wait.");
      return;
    }
    if (!isAuthenticated) {
      setAuthError("You must sign in before uploading.");
      return;
    }

    try {
      // Validate resource identifier
      if (!resource) {
        throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable.");
      }

      // Use M2M access token from TokenProvider
      if (!accessToken) {
        throw new Error(
          "Failed to obtain access token. Try signing out and back in."
        );
      }

      // API endpoint (same as resource for now)
      const apiEndpoint = resource;

      if (!apiEndpoint) {
        throw new Error("Upload endpoint not configured");
      }

      // Validate projectId is provided
      if (!projectId) {
        throw new Error("Project ID is required for file uploads");
      }

      // Set status to uploading
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "uploading" } : u
        )
      );

      // Try TUS protocol first
      logger.debug(
        { uploadId: upload.id, filename: upload.file.name },
        "Attempting TUS upload"
      );
      const tusUpload = new tus.Upload(upload.file, {
        endpoint: `${apiEndpoint}/projects/${projectId}/files`,
        retryDelays: [0, 1000, 3000], // Shorter delays for fallback
        metadata: {
          filename: upload.file.name,
          filetype: upload.file.type,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        onError: (error) => {
          logger.error(
            { uploadId: upload.id, error: error.message },
            "TUS upload error"
          );

          // Check if it's a 401 error (token expired)
          const is401Error =
            error.message?.includes("401") ||
            error.message?.includes("Unauthorized") ||
            error.message?.includes("Signature has expired") ||
            error.message?.includes("token expired") ||
            error.message?.includes("Invalid token");

          if (is401Error) {
            logger.error(
              { uploadId: upload.id },
              "TUS upload failed: Token expired, redirecting to sign out"
            );
            window.location.href = "/api/logto/sign-out";
            return;
          }

          // Check if it's a 422 error (TUS not supported) or other client error
          const is422Error =
            error.message?.includes("422") ||
            error.message?.includes("Unprocessable Entity") ||
            error.message?.includes("Field required");

          if (is422Error) {
            logger.info(
              { uploadId: upload.id },
              "TUS not supported (422 error), falling back to XHR upload"
            );
            // Fallback to standard XHR upload - pass current values to avoid stale closure
            startUploadWithXHR(upload, accessToken, projectId!);
          } else {
            // Other errors - mark as failed
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? {
                      ...u,
                      status: "error",
                      error: error.message || "Upload failed",
                    }
                  : u
              )
            );
          }
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id ? { ...u, progress: percentage } : u
            )
          );
          onUploadProgress?.(upload.id, percentage);
        },
        onSuccess: () => {
          logger.info(
            { uploadId: upload.id, filename: upload.file.name },
            "TUS upload completed successfully"
          );
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { ...u, status: "completed", progress: 100 }
                : u
            )
          );
          onUploadComplete?.([upload.file]);
        },
      });

      // Store TUS upload instance for pause/resume functionality
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, tusUpload, uploadMethod: "tus" } : u
        )
      );

      // Start the TUS upload
      tusUpload.start();
    } catch (error) {
      logger.error(
        { uploadId: upload.id, error },
        "Upload initialization error"
      );
      if (!isAuthenticated) {
        setAuthError("Not authenticated. Please sign in.");
      } else if (
        error instanceof Error &&
        /access token/i.test(error.message)
      ) {
        setAuthError(
          "Access token unavailable. Re-authenticate if problem persists."
        );
      }
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? {
                ...u,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : u
        )
      );
    }
  };

  // When auth becomes available, clear transient auth errors and revert auth-related error statuses back to pending
  useEffect(() => {
    if (isAuthenticated) {
      setUploads((prev) =>
        prev.map((u) => {
          if (
            u.status === "error" &&
            u.error &&
            (/sign in/i.test(u.error) ||
              /Authentication still loading/i.test(u.error))
          ) {
            return { ...u, status: "pending", error: undefined };
          }
          return u;
        })
      );
      // Use functional setState to read current authError without including it in dependencies
      setAuthError((prev) => (prev ? null : prev));
    }
  }, [isAuthenticated]);

  const pauseUpload = (upload: FileUploadItem) => {
    if (upload.uploadMethod === "tus" && upload.tusUpload) {
      upload.tusUpload.abort();
    } else if (upload.uploadMethod === "xhr" && upload.xhr) {
      upload.xhr.abort();
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: "paused" } : u))
    );
  };

  const resumeUpload = async (upload: FileUploadItem) => {
    if (upload.uploadMethod === "tus" && upload.tusUpload) {
      // TUS supports true resumable uploads
      logger.debug(
        { uploadId: upload.id },
        "Resuming TUS upload from where it left off"
      );
      upload.tusUpload.start();
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "uploading" } : u
        )
      );
    } else {
      // XHR uploads cannot be resumed - need to restart
      logger.warn(
        { uploadId: upload.id, method: "xhr" },
        "XHR upload cannot be resumed, restarting from beginning"
      );
      startUpload(upload);
    }
  };

  const removeUpload = (uploadId: string) => {
    const uploadToRemove = uploads.find((u) => u.id === uploadId);

    // Abort TUS or XHR upload if it exists
    if (uploadToRemove?.uploadMethod === "tus" && uploadToRemove.tusUpload) {
      uploadToRemove.tusUpload.abort();
    } else if (uploadToRemove?.uploadMethod === "xhr" && uploadToRemove.xhr) {
      uploadToRemove.xhr.abort();
    }

    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const getStatusIcon = (status: FileUploadItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FileUploadItem["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "uploading":
        return "border-blue-200 bg-blue-50";
      case "paused":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const UnauthBanner =
    !authLoading && !isAuthenticated ? (
      <div
        className="rounded-md border border-blue-200 bg-blue-50 p-4 text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm text-blue-700">
          Sign in required to upload files.
        </p>
        <Button asChild className="mt-3">
          <a href="/api/logto/sign-in">Sign In</a>
        </Button>
      </div>
    ) : null;

  interface UploadRowProps {
    item: FileUploadItem;
    onStart: (item: FileUploadItem) => void;
    onPause: (item: FileUploadItem) => void;
    onResume: (item: FileUploadItem) => void;
    onRemove: (id: string) => void;
    isAuthed: boolean;
    loadingAuth: boolean;
  }

  const UploadRow = memo(function UploadRow({
    item,
    onStart,
    onPause,
    onResume,
    onRemove,
    isAuthed,
    loadingAuth,
  }: UploadRowProps) {
    return (
      <div
        className={cn(
          "border rounded-lg p-4 transition-colors",
          getStatusColor(item.status)
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(item.file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden"
              aria-label="Upload progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.progress}
            >
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-12">
              {formatUploadProgress(item.progress, 100)}
            </span>
            <div className="flex space-x-1">
              {item.status === "pending" && isAuthed && (
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Start upload"
                  onClick={() => onStart(item)}
                  disabled={!isAuthed || loadingAuth}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              {item.status === "uploading" && (
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Pause upload"
                  onClick={() => onPause(item)}
                >
                  <Pause className="h-3 w-3" />
                </Button>
              )}
              {item.status === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Resume upload"
                  onClick={() => onResume(item)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-label="Remove upload"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        {item.error && (
          <p className="text-xs text-red-600 mt-2" role="alert">
            {item.error}
          </p>
        )}
      </div>
    );
  });

  return (
    <div className="card--borderless w-full">
      <h3 className="card-title">Upload Files</h3>
      {authError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {authError}
        </div>
      )}
      {UnauthBanner}
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300",
          !isAuthenticated || authLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-400"
        )}
      >
        <input
          {...getInputProps()}
          disabled={!isAuthenticated || authLoading}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500">
          {authLoading
            ? "Checking authentication..."
            : !isAuthenticated
            ? "Please sign in to enable uploads"
            : `or click to select files (max ${formatBytes(maxSize)})`}
        </p>
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="card-title mb-2">Upload Queue</h3>
          {uploads.map((u) => (
            <UploadRow
              key={u.id}
              item={u}
              onStart={startUpload}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onRemove={removeUpload}
              isAuthed={isAuthenticated}
              loadingAuth={authLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
