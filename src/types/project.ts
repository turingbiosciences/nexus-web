export type ProjectStatus = "complete" | "running" | "setup";

// Define status order for consistent iteration across the application
export const STATUS_ORDER = ["complete", "running", "setup"] as const;

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
