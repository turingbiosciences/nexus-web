"use client";

import { useCallback, useState, useEffect, memo } from "react";
import { useDropzone } from "react-dropzone";
import * as tus from "tus-js-client";
import { Upload, X, CheckCircle, AlertCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes, formatUploadProgress } from "@/lib/utils";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  error?: string;
  tusUpload?: tus.Upload;
}

interface FileUploaderProps {
  maxSize?: number;
  onUploadComplete?: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
}

export function FileUploader({
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
  onUploadComplete,
  onUploadProgress,
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);
  const { getAccessToken, isAuthenticated, isLoading } = useGlobalAuth();
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

  const startUpload = async (upload: FileUploadItem) => {
    // Block if auth not ready; don't mutate upload status yet
    if (isLoading) {
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

      // Get Logto access token for API authentication
      // Note: Without API resources configured in Logto, getAccessToken() may return undefined
      // In that case, we'll need to get the ID token instead
      let token: string | undefined;
      try {
        token = await getAccessToken(resource);
      } catch (err) {
        console.warn(
          "Failed to get access token with resource, trying without resource:",
          err
        );
        // Fallback: try getting token without resource parameter
        token = await getAccessToken();
      }

      if (!token) {
        throw new Error(
          "Failed to obtain access token. Try signing out and back in."
        );
      }

      // API endpoint (same as resource for now)
      const apiEndpoint = resource;

      if (!apiEndpoint) {
        throw new Error("Upload endpoint not configured");
      }

      // Create TUS upload instance
      const tusUpload = new tus.Upload(upload.file, {
        endpoint: `${apiEndpoint}/uploads`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: upload.file.name,
          filetype: upload.file.type,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onError: (error) => {
          console.error("TUS upload error:", error);
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

      // Store TUS upload instance and set status to uploading
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "uploading", tusUpload } : u
        )
      );

      // Start the upload
      tusUpload.start();
    } catch (error) {
      console.error("Upload initialization error:", error);
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
      if (authError) {
        setAuthError(null);
      }
    }
  }, [isAuthenticated, authError]);

  const pauseUpload = (upload: FileUploadItem) => {
    if (upload.tusUpload) {
      upload.tusUpload.abort();
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: "paused" } : u))
    );
  };

  const resumeUpload = async (upload: FileUploadItem) => {
    // If TUS upload exists, resume it
    if (upload.tusUpload) {
      try {
        // Get fresh access token (may have expired during pause)
        const token = await getAccessToken(process.env.NEXT_PUBLIC_TURING_API);

        if (!token) {
          throw new Error(
            "Failed to obtain access token. Please try signing out and back in."
          );
        }

        // Update auth token in case it expired
        upload.tusUpload.options.headers = {
          Authorization: `Bearer ${token}`,
        };

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "uploading" } : u
          )
        );

        upload.tusUpload.start();
      } catch (error) {
        console.error("Resume upload error:", error);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Resume failed",
                }
              : u
          )
        );
      }
    } else {
      // If no TUS upload exists, start a new one
      startUpload(upload);
    }
  };

  const removeUpload = (uploadId: string) => {
    // Abort TUS upload if it exists
    const uploadToRemove = uploads.find((u) => u.id === uploadId);
    if (uploadToRemove?.tusUpload) {
      uploadToRemove.tusUpload.abort();
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
    !isLoading && !isAuthenticated ? (
      <div
        className="rounded-md border border-blue-200 bg-blue-50 p-4 text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm text-blue-700">
          Sign in required to upload files.
        </p>
        <a
          href="/api/logto/sign-in"
          className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign In
        </a>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(item.file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
    <div className="w-full space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h3>
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
          !isAuthenticated || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} disabled={!isAuthenticated || isLoading} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500">
          {isLoading
            ? "Checking authentication..."
            : !isAuthenticated
            ? "Please sign in to enable uploads"
            : `or click to select files (max ${formatBytes(maxSize)})`}
        </p>
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Queue</h3>
          {uploads.map((u) => (
            <UploadRow
              key={u.id}
              item={u}
              onStart={startUpload}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onRemove={removeUpload}
              isAuthed={isAuthenticated}
              loadingAuth={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
