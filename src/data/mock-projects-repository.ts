import { mockProjects } from "@/lib/mock-data";
import { Project, ProjectDataset } from "@/types/project";
import { ProjectsRepository, DatasetPage } from "./projects-repository";

// In-memory mutable clone so that repository operations don't mutate original export unintentionally
let store: Project[] = mockProjects.map((p) => ({
  ...p,
  datasets: p.datasets ? [...p.datasets] : [],
  activities: p.activities ? [...p.activities] : [],
}));

function findProject(id: string): Project | undefined {
  return store.find((p) => p.id === id);
}

export class MockProjectsRepository implements ProjectsRepository {
  async list(): Promise<Project[]> {
    return store;
  }

  async get(id: string): Promise<Project | undefined> {
    return findProject(id);
  }

  async create(input: { name: string; description: string }): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description.trim(),
      status: "setup",
      createdAt: now,
      updatedAt: now,
      datasetCount: 0,
      lastActivity: "just now",
      datasets: [],
      activities: [
        {
          id: crypto.randomUUID(),
          type: "created",
          message: "Project created",
          at: now,
        },
      ],
    };
    store = [project, ...store];
    return project;
  }

  async update(
    id: string,
    patch: Partial<Project>
  ): Promise<Project | undefined> {
    const existing = findProject(id);
    if (!existing) return undefined;
    const now = new Date();
    const updated: Project = { ...existing, ...patch, updatedAt: now };
    store = store.map((p) => (p.id === id ? updated : p));
    return updated;
  }

  async addDataset(
    id: string,
    file: { name: string; size: number }
  ): Promise<ProjectDataset> {
    const project = findProject(id);
    if (!project) throw new Error("Project not found");
    const dataset: ProjectDataset = {
      id: crypto.randomUUID(),
      filename: file.name,
      size: file.size,
      uploadedAt: new Date(),
    };
    project.datasets = [...(project.datasets || []), dataset];
    project.datasetCount = project.datasets.length;
    project.updatedAt = new Date();
    project.lastActivity = "dataset uploaded";
    return dataset;
  }

  async deleteDataset(id: string, datasetId: string): Promise<boolean> {
    const project = findProject(id);
    if (!project) return false;
    const before = project.datasets?.length || 0;
    project.datasets = (project.datasets || []).filter(
      (d) => d.id !== datasetId
    );
    project.datasetCount = project.datasets.length;
    project.updatedAt = new Date();
    project.lastActivity = "dataset deleted";
    return project.datasets.length < before;
  }

  async listDatasets(
    id: string,
    opts?: { cursor?: string; limit?: number }
  ): Promise<DatasetPage> {
    const project = findProject(id);
    const all = project?.datasets || [];
    const limit = opts?.limit ?? 50;
    const startIndex = opts?.cursor ? parseInt(opts.cursor, 10) : 0;
    const items = all.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;
    return {
      items,
      nextCursor: nextIndex < all.length ? String(nextIndex) : undefined,
      total: all.length,
    };
  }
}
