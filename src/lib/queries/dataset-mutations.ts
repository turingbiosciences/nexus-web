import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onMutate: async (file: File) => {
      await qc.cancelQueries({ queryKey: ["datasets", projectId] });
      const prev = qc.getQueryData<ProjectDataset[]>(["datasets", projectId]);
      const optimistic: ProjectDataset = {
        id: `optimistic-${crypto.randomUUID()}`,
        filename: file.name,
        size: file.size,
        uploadedAt: new Date(),
      };
      qc.setQueryData<ProjectDataset[]>(
        ["datasets", projectId],
        [...(prev || []), optimistic]
      );
      return { prev, optimisticId: optimistic.id };
    },
    onError: (_err, _file, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["datasets", projectId], ctx.prev);
      }
    },
    onSuccess: (data, _file, ctx) => {
      const current =
        qc.getQueryData<ProjectDataset[]>(["datasets", projectId]) || [];
      qc.setQueryData<ProjectDataset[]>(
        ["datasets", projectId],
        current.map((d) => (d.id === ctx?.optimisticId ? data : d))
      );
    },
  });
}

export function useDeleteDatasetMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["delete", projectId],
    mutationFn: (datasetId: string) =>
      apiDeleteDataset({ projectId, datasetId }),
    onMutate: async (datasetId: string) => {
      await qc.cancelQueries({ queryKey: ["datasets", projectId] });
      const prev = qc.getQueryData<ProjectDataset[]>(["datasets", projectId]);
      qc.setQueryData<ProjectDataset[]>(
        ["datasets", projectId],
        (prev || []).filter((d) => d.id !== datasetId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["datasets", projectId], ctx.prev);
    },
    onSuccess: () => {
      // Optionally refetch for server reconciliation
    },
  });
}
