export type ProjectStatus = 'complete' | 'running' | 'setup';

// Define status order for consistent iteration across the application
export const STATUS_ORDER = ['complete', 'running', 'setup'] as const;

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
  datasets?: ProjectDataset[]; // in-memory list of uploaded dataset files (placeholder until backend integration)
  activities?: ProjectActivity[]; // timeline of events (uploads, edits)
  results?: ProjectResult[]; // analysis results and outputs
}

export interface ProjectStatusCount {
  complete: number;
  running: number;
  setup: number;
}

export interface ProjectDataset {
  id: string; // uuid
  filename: string;
  size: number; // bytes
  uploadedAt: Date;
}

export interface ProjectActivity {
  id: string;
  type: 'created' | 'updated' | 'upload' | 'delete' | 'status_change';
  message: string;
  at: Date;
}

export interface ProjectResult {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  size?: number;
  url?: string;
}
