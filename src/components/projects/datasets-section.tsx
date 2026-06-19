'use client';

import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/file-upload/file-uploader';
import { formatBytes } from '@/lib/utils';
import { useProjects } from '@/components/providers/projects-provider';
import { useDatasets } from '@/lib/queries/datasets';
import { reconcileDatasets } from '@/lib/reconcile-datasets';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Trash2 } from 'lucide-react';
import {
  useDeleteDatasetMutation,
  useDownloadDatasetMutation,
} from '@/lib/queries/dataset-mutations';

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
    | import('@/types/project').ProjectDataset[]
    | undefined; // flattened array per hook contract (paginated=false default)
  const remoteLoading = datasetsQuery.isLoading;
  const nextCursor = (datasetsQuery as { nextCursor?: string }).nextCursor;
  const deleteMutation = useDeleteDatasetMutation(projectId);
  const downloadMutation = useDownloadDatasetMutation(projectId);
  const { push } = useToast();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const combined = useMemo(() => {
    const optimistic = (project?.datasets || []).filter((d) =>
      d.id.startsWith('optimistic-')
    );
    // Optimized: Sort and filter within useMemo to prevent re-sorting on every render
    return reconcileDatasets({
      remote: remoteDatasets,
      optimistic,
      pendingDeleteIds,
    })
      .filter((d) => d?.id)
      .sort(
        (a, b) => (b.uploadedAt.getTime() || 0) - (a.uploadedAt.getTime() || 0)
      );
  }, [project?.datasets, remoteDatasets, pendingDeleteIds]);

  // Sync datasetCount from API with project state
  const total = (datasetsQuery as { total?: number }).total;
  useEffect(() => {
    if (remoteDatasets && !remoteLoading && total !== undefined && project) {
      const currentCount = project.datasetCount ?? 0;
      const apiCount = total;
      if (currentCount !== apiCount) {
        updateProject(project.id, { datasetCount: apiCount });
      }
    }
  }, [remoteDatasets, remoteLoading, total, project, updateProject]);

  if (!project) return null;

  return (
    <div className="card">
      <h3 className="card-title">Datasets</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {(project.datasetCount ?? 0) === 0
            ? 'No datasets found.'
            : `This project has ${project.datasetCount} dataset(s).`}
        </p>
        {remoteLoading && (
          <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-4 py-3 bg-white">
                <Skeleton width="33%" height="0.75rem" className="mb-2" />
                <Skeleton width="25%" height="0.5rem" />
              </li>
            ))}
          </ul>
        )}
        {combined.length > 0 && !remoteLoading && (
          <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
            {combined.map((d) => (
              <li
                key={d.id}
                className={`flex items-center justify-between px-4 py-3 text-sm bg-white hover:bg-gray-50 ${
                  d.id?.startsWith('optimistic-') ? 'opacity-70 italic' : ''
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
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
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    disabled={downloadMutation.isPending}
                    onClick={() => {
                      downloadMutation.mutate(d.id, {
                        onError: () => {
                          push({
                            title: 'Download failed',
                            description: `Could not download ${d.filename}. Please retry.`,
                            variant: 'destructive',
                          });
                        },
                      });
                    }}
                    aria-label={`Download ${d.filename}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    disabled={deleteMutation.isPending}
                    aria-label={`Delete ${d.filename}`}
                    onClick={() => {
                      const newDatasets =
                        project.datasets?.filter((x) => x.id !== d.id) || [];
                      updateProject(project.id, {
                        datasets: newDatasets,
                        datasetCount: newDatasets.length,
                        lastActivity: 'dataset deleted',
                      });
                      setPendingDeleteIds((prev) => [...prev, d.id]);
                      deleteMutation.mutate(d.id, {
                        onSuccess: () => {
                          push({
                            title: 'Dataset deleted',
                            description: `${d.filename} was removed successfully.`,
                            variant: 'default',
                          });
                        },
                        onError: () => {
                          push({
                            title: 'Deletion failed',
                            description: `Could not delete ${d.filename}. Please retry.`,
                            variant: 'destructive',
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
                    <Trash2 className="h-4 w-4" />
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
                // File was already uploaded by FileUploader via XHR — just
                // update optimistic state and show a toast per file.
                addDataset(project.id);
                push({
                  title: 'Upload complete',
                  description: `${f.name} was uploaded successfully.`,
                  variant: 'default',
                });
              });
              // Single refetch after all files are processed to avoid N
              // redundant API calls when multiple files are uploaded at once.
              datasetsQuery.refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
