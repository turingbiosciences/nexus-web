"use client";

import { ActivitiesSection } from "@/components/projects/activities-section";

interface ProjectActivityTabProps {
  projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  return <ActivitiesSection projectId={projectId} />;
}
