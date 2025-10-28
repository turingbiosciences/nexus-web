import { Suspense } from "react";
import { ProjectDetailsClient } from "./project-details-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading project...</div>}
    >
      <ProjectDetailsClient projectId={id} />
    </Suspense>
  );
}
