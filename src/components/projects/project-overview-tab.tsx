"use client";

import { ProjectStatsCard } from "@/components/projects/project-stats-card";

interface ProjectOverviewTabProps {
  projectId: string;
}

export function ProjectOverviewTab({ projectId }: ProjectOverviewTabProps) {
  return <ProjectStatsCard projectId={projectId} />;
}
