import { useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsKey } from '@/lib/queries/keys';
import { ProjectDataset } from '@/types/project';
import { getApiBaseUrl } from '@/lib/api/get-api-base';
import { useAccessToken } from '@/components/providers/token-provider';

interface UploadArgs {
  projectId: string;
  file: File;
  token?: string | null;
}

interface DeleteArgs {
  projectId: string;
  datasetId: string;
  token?: string | null;
}

/**
 * Upload file to the backend
 * NOTE: This uploads the actual file using multipart/form-data
 */
async function apiUploadDataset({
  file,
  projectId,
  token,
}: UploadArgs): Promise<ProjectDataset> {
  const apiEndpoint = getApiBaseUrl();
  let accessToken = token;

  // If no token provided, fetch it (fallback behavior)
  if (!accessToken) {
    const tokenResponse = await fetch('/api/logto/token');
    if (!tokenResponse.ok) {
      throw new Error('Failed to obtain access token');
    }
    const data = await tokenResponse.json();
    accessToken = data.accessToken;
  }

  // Upload the file using FormData
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiEndpoint}/projects/${projectId}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
    },
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
  token,
}: DeleteArgs): Promise<{ success: boolean }> {
  const apiEndpoint = getApiBaseUrl();
  let accessToken = token;

  // If no token provided, fetch it (fallback behavior)
  if (!accessToken) {
    const tokenResponse = await fetch('/api/logto/token');
    if (!tokenResponse.ok) {
      throw new Error('Failed to obtain access token');
    }
    const data = await tokenResponse.json();
    accessToken = data.accessToken;
  }

  const response = await fetch(
    `${apiEndpoint}/projects/${projectId}/files/${datasetId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
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
  const { accessToken } = useAccessToken();

  return useMutation({
    mutationKey: ['upload', projectId],
    mutationFn: (file: File) =>
      apiUploadDataset({ projectId, file, token: accessToken }),
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
  const { accessToken } = useAccessToken();

  return useMutation({
    mutationKey: ['delete', projectId],
    mutationFn: (datasetId: string) =>
      apiDeleteDataset({ projectId, datasetId, token: accessToken }),
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
