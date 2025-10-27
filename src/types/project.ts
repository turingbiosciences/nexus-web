export type ProjectStatus = "complete" | "running" | "setup";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  datasetCount?: number;
  lastActivity?: string;
}

export interface ProjectStatusCount {
  complete: number;
  running: number;
  setup: number;
}
