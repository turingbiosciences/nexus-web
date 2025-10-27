"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Project,
  ProjectStatusCount,
  STATUS_ORDER,
  ProjectActivity,
} from "@/types/project";
import { projectsRepository } from "@/data";

interface ProjectsContextValue {
  projects: Project[];
  createProject: (data: {
    name: string;
    description: string;
  }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  getProjectById: (id: string) => Project | undefined;
  getStatusCounts: () => ProjectStatusCount;
  addDataset: (projectId: string, file: { name: string; size: number }) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(
  undefined
);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  // Initial load (mock or live via repository)
  if (projects.length === 0) {
    // This is a client component; safe to kick async load without useEffect minimal risk here, but better with effect.
    // Using lazy pattern to avoid multiple set states.
    (async () => {
      const list = await projectsRepository.list();
      if (projects.length === 0) setProjects(list);
    })();
  }

  const createProject = useCallback(
    (data: { name: string; description: string }) => {
      return projectsRepository.create(data).then((p) => {
        setProjects((prev) => [p, ...prev]);
        return p;
      });
    },
    []
  );

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const now = new Date();
        const activities = [...(p.activities || [])];
        if (updates.status && updates.status !== p.status) {
          activities.push({
            id: crypto.randomUUID(),
            type: "status_change",
            message: `Status changed to ${updates.status}`,
            at: now,
          } satisfies ProjectActivity);
        }
        if (updates.name && updates.name !== p.name) {
          activities.push({
            id: crypto.randomUUID(),
            type: "updated",
            message: "Name updated",
            at: now,
          } satisfies ProjectActivity);
        }
        if (updates.description && updates.description !== p.description) {
          activities.push({
            id: crypto.randomUUID(),
            type: "updated",
            message: "Description updated",
            at: now,
          } satisfies ProjectActivity);
        }
        return {
          ...p,
          ...updates,
          updatedAt: updates.updatedAt ? updates.updatedAt : now,
          lastActivity: updates.lastActivity || "just now",
          activities,
        };
      })
    );
    projectsRepository.update(id, updates).catch(() => {
      /* swallow mock */
    });
  }, []);

  const addDataset = useCallback(
    (projectId: string, file: { name: string; size: number }) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const now = new Date();
          const optimistic = {
            id: `optimistic-${crypto.randomUUID()}`,
            filename: file.name,
            size: file.size,
            uploadedAt: now,
          };
          const datasets = [...(p.datasets || []), optimistic];
          const activities = [
            ...(p.activities || []),
            {
              id: crypto.randomUUID(),
              type: "upload",
              message: `Uploaded ${file.name}`,
              at: now,
            } satisfies ProjectActivity,
          ];
          return {
            ...p,
            datasets,
            datasetCount: datasets.length,
            updatedAt: now,
            lastActivity: "dataset uploaded",
            activities,
          };
        })
      );
      projectsRepository.addDataset(projectId, file).catch(() => {
        /* swallow mock */
      });
    },
    []
  );

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const getStatusCounts = useCallback((): ProjectStatusCount => {
    const initial = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as ProjectStatusCount);
    return projects.reduce((acc, p) => {
      acc[p.status]++;
      return acc;
    }, initial);
  }, [projects]);

  const value: ProjectsContextValue = {
    projects,
    createProject,
    updateProject,
    getProjectById,
    getStatusCounts,
    addDataset,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx)
    throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
}
