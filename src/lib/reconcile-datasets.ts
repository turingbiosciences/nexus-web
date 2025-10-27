import type { ProjectDataset } from "@/types/project";

/**
 * Reconcile remote datasets with optimistic local ones.
 * - Keeps optimistic entries whose filename+size pair not yet confirmed by server
 * - If server returns a dataset that matches an optimistic placeholder (by filename+size within 10s window), replace it
 * - Ensures stable ordering: remote first (original order), then remaining optimistic
 * - Filters out any datasets (remote or optimistic) that are pending deletion
 */
export function reconcileDatasets(opts: {
  remote?: ProjectDataset[];
  optimistic?: ProjectDataset[];
  pendingDeleteIds?: string[];
}): ProjectDataset[] {
  const remote = opts.remote || [];
  const optimistic = (opts.optimistic || []).filter((d) =>
    d.id.startsWith("optimistic-")
  );
  const pendingDeleteIds = new Set(opts.pendingDeleteIds || []);

  const filteredRemote = remote.filter((d) => !pendingDeleteIds.has(d.id));
  const filteredOptimistic = optimistic.filter(
    (d) => !pendingDeleteIds.has(d.id)
  );
  if (filteredOptimistic.length === 0) return filteredRemote;

  const bySignature = new Map<string, ProjectDataset>();
  const signature = (d: ProjectDataset) => `${d.filename}__${d.size}`;
  filteredRemote.forEach((d) => bySignature.set(signature(d), d));

  const remainingOptimistic: ProjectDataset[] = [];
  for (const o of filteredOptimistic) {
    const match = bySignature.get(signature(o));
    if (!match) {
      remainingOptimistic.push(o);
      continue;
    }
    if (
      Math.abs(match.uploadedAt.getTime() - o.uploadedAt.getTime()) > 10_000
    ) {
      remainingOptimistic.push(o);
    }
  }
  return [...filteredRemote, ...remainingOptimistic];
}
