import { ProjectDataset } from "@/types/project";

/**
 * Reconcile remote datasets with optimistic local ones.
 * - Keeps optimistic entries whose filename+size pair not yet confirmed by server
 * - If server returns a dataset that matches an optimistic placeholder (by filename+size within 5s window), replace it
 * - Ensures stable ordering: remote first (original order), then remaining optimistic
 */
export function reconcileDatasets(params: {
  remote?: ProjectDataset[];
  optimistic?: ProjectDataset[];
}): ProjectDataset[] {
  const remote = params.remote || [];
  const optimistic = (params.optimistic || []).filter((d) =>
    d.id.startsWith("optimistic-")
  );
  if (optimistic.length === 0) return remote;

  const bySignature = new Map<string, ProjectDataset>();
  const signature = (d: ProjectDataset) => `${d.filename}__${d.size}`;
  remote.forEach((d) => bySignature.set(signature(d), d));

  const remainingOptimistic: ProjectDataset[] = [];
  for (const o of optimistic) {
    const match = bySignature.get(signature(o));
    if (!match) {
      // Keep if not matched yet
      remainingOptimistic.push(o);
      continue;
    }
    // If timestamps differ widely ( > 10s ), treat as distinct and keep optimistic
    if (
      Math.abs(match.uploadedAt.getTime() - o.uploadedAt.getTime()) > 10_000
    ) {
      remainingOptimistic.push(o);
    }
  }
  return [...remote, ...remainingOptimistic];
}
