"use client";

import { DatasetsSection } from "@/components/projects/datasets-section";

interface ProjectDatasetsTabProps {
  projectId: string;
}

export function ProjectDatasetsTab({ projectId }: ProjectDatasetsTabProps) {
  return <DatasetsSection projectId={projectId} />;
}
