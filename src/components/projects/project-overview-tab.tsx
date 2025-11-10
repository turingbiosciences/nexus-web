"use client";

import { DatasetsSection } from "@/components/projects/datasets-section";
import { ActivitiesSection } from "@/components/projects/activities-section";

interface ProjectOverviewTabProps {
  projectId: string;
}

export function ProjectOverviewTab({ projectId }: ProjectOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DatasetsSection projectId={projectId} />
      <ActivitiesSection projectId={projectId} />
    </div>
  );
}
