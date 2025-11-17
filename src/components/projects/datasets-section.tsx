"use client";

import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/file-upload/file-uploader";
import { formatBytes } from "@/lib/utils";
import { useProjects } from "@/components/providers/projects-provider";
import { useDatasets } from "@/lib/queries/datasets";
import { reconcileDatasets } from "@/lib/reconcile-datasets";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import {
  useUploadDatasetMutation,
  useDeleteDatasetMutation,
} from "@/lib/queries/dataset-mutations";

interface DatasetsSectionProps {
  projectId: string;
  showUploader?: boolean;
  pageSize?: number;
}

export function DatasetsSection({
  projectId,
  showUploader = true,
  pageSize = 50,
}: DatasetsSectionProps) {
  const { getProjectById, addDataset, updateProject } = useProjects();
  const project = getProjectById(projectId);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const datasetsQuery = useDatasets(projectId, {
    enabled: true,
    cursor,
    limit: pageSize,
  });
  const remoteDatasets = datasetsQuery.data as
    | import("@/types/project").ProjectDataset[]
    | undefined; // flattened array per hook contract (paginated=false default)
  const remoteLoading = datasetsQuery.isLoading;
  const nextCursor = (datasetsQuery as { nextCursor?: string }).nextCursor;
  const uploadMutation = useUploadDatasetMutation(projectId);
  const deleteMutation = useDeleteDatasetMutation(projectId);
  const { push } = useToast();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  if (!project) return null;

  const optimistic = (project.datasets || []).filter((d) =>
    d.id.startsWith("optimistic-")
  );
  const combined = reconcileDatasets({
    remote: remoteDatasets,
    optimistic,
    pendingDeleteIds,
  });

  // Sync datasetCount from API with project state
  const total = (datasetsQuery as { total?: number }).total;
  useEffect(() => {
    if (remoteDatasets && !remoteLoading && total !== undefined) {
      const currentCount = project.datasetCount ?? 0;
      const apiCount = total;
      if (currentCount !== apiCount) {
        updateProject(project.id, { datasetCount: apiCount });
      }
    }
  }, [
    remoteDatasets,
    remoteLoading,
    total,
    project.id,
    project.datasetCount,
    updateProject,
  ]);

  return (
    <div className="card">
      <h3 className="card-title">Datasets</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {(project.datasetCount ?? 0) === 0
            ? "No datasets found."
            : `This project has ${project.datasetCount} dataset(s).`}
        </p>
        {remoteLoading && (
          <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-4 py-3 bg-white">
                <div className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
                <div className="h-2 w-1/4 bg-gray-100 rounded" />
              </li>
            ))}
          </ul>
        )}
        {combined.length > 0 && !remoteLoading && (
          <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
            {combined
              .filter((d) => d?.id)
              .map((d) => (
                <li
                  key={d.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm bg-white hover:bg-gray-50 ${
                    d.id?.startsWith("optimistic-") ? "opacity-70 italic" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {d.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(d.size)} • {d.uploadedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        // Temporary stub for download action; logs for test instrumentation
                        console.log("Download dataset", d.id);
                      }}
                      aria-label={`Download ${d.filename}`}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        const newDatasets =
                          project.datasets?.filter((x) => x.id !== d.id) || [];
                        updateProject(project.id, {
                          datasets: newDatasets,
                          datasetCount: newDatasets.length,
                          lastActivity: "dataset deleted",
                        });
                        setPendingDeleteIds((prev) => [...prev, d.id]);
                        deleteMutation.mutate(d.id, {
                          onSuccess: () => {
                            push({
                              title: "Dataset deleted",
                              description: `${d.filename} was removed successfully.`,
                              variant: "default",
                            });
                          },
                          onError: () => {
                            push({
                              title: "Deletion failed",
                              description: `Could not delete ${d.filename}. Please retry.`,
                              variant: "destructive",
                            });
                          },
                          onSettled: () => {
                            setPendingDeleteIds((prev) =>
                              prev.filter((id) => id !== d.id)
                            );
                          },
                        });
                      }}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
        {nextCursor && !remoteLoading && (
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCursor(nextCursor)}
              disabled={remoteLoading}
            >
              Load more
            </Button>
          </div>
        )}
        {showUploader && (
          <FileUploader
            projectId={projectId}
            maxSize={5 * 1024 * 1024 * 1024}
            onUploadComplete={(files) => {
              if (!project) return;
              files.forEach((f) => {
                addDataset(project.id, { name: f.name, size: f.size });
                uploadMutation.mutate(f, {
                  onSuccess: () => {
                    push({
                      title: "Upload complete",
                      description: `${f.name} was uploaded successfully.`,
                      variant: "default",
                    });
                  },
                  onError: () => {
                    push({
                      title: "Upload failed",
                      description: `Could not upload ${f.name}. Please try again.`,
                      variant: "destructive",
                    });
                  },
                });
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
