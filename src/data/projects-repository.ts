import { Project, ProjectDataset } from "@/types/project";

export interface DatasetPage {
  items: ProjectDataset[];
  nextCursor?: string; // opaque pagination cursor
  total?: number;
}

export interface ProjectsRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  create(input: { name: string; description: string }): Promise<Project>;
  update(id: string, patch: Partial<Project>): Promise<Project | undefined>;
  addDataset(id: string, file: { name: string; size: number }): Promise<ProjectDataset>;
  deleteDataset(id: string, datasetId: string): Promise<boolean>;
  listDatasets(id: string, opts?: { cursor?: string; limit?: number }): Promise<DatasetPage>;
}
