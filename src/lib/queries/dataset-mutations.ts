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
      await qc.cancelQueries({ queryKey: datasetsKey(projectId) });
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onSuccess: () => {
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
      await qc.cancelQueries({ queryKey: datasetsKey(projectId) });
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onError: () => {
      // Rollback by refetching; UI component already keeps local pendingDeleteIds state which will be cleared via onSettled
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: datasetsKey(projectId) });
    },
  });
}
