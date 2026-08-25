import { useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsKey } from '@/lib/queries/keys';
import { ProjectDataset } from '@/types/project';
import { getApiBaseUrl } from '@/lib/api/get-api-base';
import { sanitizeFilename } from '@/lib/security';

interface UploadArgs {
  projectId: string;
  file: File;
}

interface DeleteArgs {
  projectId: string;
  datasetId: string;
}

interface DownloadArgs {
  projectId: string;
  datasetId: string;
}

interface DownloadUrlResponse {
  download_url: string;
  filename: string;
  expires_in: number;
}

/**
 * Upload file to the backend
 * NOTE: This uploads the actual file using multipart/form-data
 */
async function apiUploadDataset({
  file,
  projectId,
}: UploadArgs): Promise<ProjectDataset> {
  const apiEndpoint = getApiBaseUrl();

  // Upload the file using FormData
  const formData = new FormData();
  formData.append('file', file, sanitizeFilename(file.name));

  const response = await fetch(`${apiEndpoint}/projects/${projectId}/files`, {
    method: 'POST',
    credentials: 'include',
    // No Content-Type - the browser sets it with the multipart boundary.
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
  }

  const dataset = await response.json();

  // Convert to ProjectDataset format
  return {
    id: dataset.id || crypto.randomUUID(),
    filename: dataset.filename || file.name,
    size: dataset.size || file.size,
    uploadedAt: dataset.uploadedAt ? new Date(dataset.uploadedAt) : new Date(),
  };
}

/**
 * Delete a dataset from the backend
 */
async function apiDeleteDataset({
  projectId,
  datasetId,
}: DeleteArgs): Promise<{ success: boolean }> {
  const apiEndpoint = getApiBaseUrl();

  const response = await fetch(
    `${apiEndpoint}/projects/${projectId}/files/${datasetId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to delete dataset: ${response.status} - ${errorText}`
    );
  }

  return { success: true };
}

export function useUploadDatasetMutation(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['upload', projectId],
    mutationFn: (file: File) => apiUploadDataset({ projectId, file }),
    onMutate: async () => {
      // Cancel in-flight queries to prevent race conditions
      await qc.cancelQueries({ queryKey: datasetsKey(projectId) });
      // Note: Do NOT invalidate here - that defeats optimistic updates
      // The component handles optimistic state via local state management
    },
    onError: () => {
      // On error, invalidate to refetch and revert to server state
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onSuccess: () => {
      // On success, invalidate to refetch with fresh server data
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
  });
}

export function useDeleteDatasetMutation(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['delete', projectId],
    mutationFn: (datasetId: string) =>
      apiDeleteDataset({ projectId, datasetId }),
    onMutate: async () => {
      // Cancel in-flight queries to prevent race conditions
      await qc.cancelQueries({ queryKey: datasetsKey(projectId) });
      // Note: Do NOT invalidate here - that defeats optimistic updates
      // The component handles optimistic state via pendingDeleteIds
    },
    onError: () => {
      // On error, invalidate to refetch and revert to server state
      // The component's onSettled callback will clear pendingDeleteIds
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onSuccess: () => {
      // On success, invalidate to refetch with fresh server data
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
  });
}

async function apiGetDatasetDownloadUrl({
  projectId,
  datasetId,
}: DownloadArgs): Promise<DownloadUrlResponse> {
  const apiEndpoint = getApiBaseUrl();

  const response = await fetch(
    `${apiEndpoint}/projects/${projectId}/files/${datasetId}/download`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get download URL: ${response.status} - ${errorText}`
    );
  }

  return response.json();
}

export function useDownloadDatasetMutation(projectId: string) {
  return useMutation({
    mutationKey: ['download', projectId],
    mutationFn: (datasetId: string) =>
      apiGetDatasetDownloadUrl({ projectId, datasetId }),
    onSuccess: ({ download_url, filename }) => {
      try {
        const parsed = new URL(download_url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error(`Unexpected protocol: ${parsed.protocol}`);
        }
        const a = document.createElement('a');
        a.href = parsed.toString();
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.error('Failed to download dataset: invalid URL', e);
      }
    },
  });
}
