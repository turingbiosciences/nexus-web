"use client";

import { ResultsSection } from "@/components/projects/results-section";

interface ProjectResultsTabProps {
  projectId: string;
}

export function ProjectResultsTab({ projectId }: ProjectResultsTabProps) {
  return <ResultsSection projectId={projectId} />;
}
