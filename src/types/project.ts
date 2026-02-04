export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  datasetCount?: number;
  lastActivity?: string;
  datasets?: ProjectDataset[]; // in-memory list of uploaded dataset files (placeholder until backend integration)
  activities?: ProjectActivity[]; // timeline of events (uploads, edits)
  results?: ProjectResult[]; // analysis results and outputs
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

export interface DashboardRun {
  job_id: string;
  project_id: string;
  project_name: string;
  algorithm: string;
  status:
    | 'pending'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';
  runtime_seconds: number;
  created_at: string;
  ended_at?: string;
}

export interface DashboardStats {
  total_projects: number;
  total_ml_runs: number;
  algorithm_wins: {
    random_forest: number;
    xgboost: number;
    catboost: number;
    lightgbm: number;
  };
  total_runtime_seconds: number;
  recent_runs: DashboardRun[];
}
