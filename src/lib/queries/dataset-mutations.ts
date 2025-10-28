import { useMutation, useQueryClient } from "@tanstack/react-query";
import { datasetsKey } from "@/lib/queries/keys";
import { ProjectDataset } from "@/types/project";

interface UploadArgs {
  projectId: string;
  file: File;
}

interface DeleteArgs {
  projectId: string;
  datasetId: string;
}

// Placeholder API calls (replace with real authenticated fetch later)
async function apiUploadDataset({ file }: UploadArgs): Promise<ProjectDataset> {
  await new Promise((r) => setTimeout(r, 500)); // simulate latency
  return {
    id: crypto.randomUUID(),
    filename: file.name,
    size: file.size,
    uploadedAt: new Date(),
  };
}

async function apiDeleteDataset({
  datasetId,
}: DeleteArgs): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 300));
  // Simulate server acknowledging deletion of datasetId
  void datasetId;
  return { success: true };
}

export function useUploadDatasetMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["upload", projectId],
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
    mutationKey: ["delete", projectId],
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
