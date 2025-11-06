"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  Project,
  ProjectStatusCount,
  STATUS_ORDER,
  ProjectActivity,
} from "@/types/project";
import {
  fetchProjects,
  createProject as createProjectAPI,
} from "@/lib/api/projects";
import { useLogto } from "@logto/react";

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  error: Error | null;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, getAccessToken } = useLogto();

  useEffect(() => {
    if (!isAuthenticated || loading || projects.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Get access token for API resource
        // Try with resource first, fallback to no resource if that fails
        let token: string | undefined;
        try {
          token = await getAccessToken(process.env.NEXT_PUBLIC_TURING_API);
        } catch (err) {
          console.warn(
            "Failed to get access token with resource, trying without resource:",
            err
          );
          token = await getAccessToken();
        }

        if (!token) {
          throw new Error(
            "Failed to obtain access token. Please try signing out and back in."
          );
        }

        const fetchedProjects = await fetchProjects(token);
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        // Keep empty array on error
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, loading, projects.length, getAccessToken]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      try {
        // Get access token for API resource
        // Try with resource first, fallback to no resource if that fails
        let token: string | undefined;
        try {
          token = await getAccessToken(process.env.NEXT_PUBLIC_TURING_API);
        } catch (err) {
          console.warn(
            "Failed to get access token with resource, trying without resource:",
            err
          );
          token = await getAccessToken();
        }

        if (!token) {
          throw new Error(
            "Failed to obtain access token. Please try signing out and back in."
          );
        }

        const newProject = await createProjectAPI(token, data);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        console.error("Failed to create project:", err);
        throw err;
      }
    },
    [getAccessToken]
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
    // TODO: Add API call to persist updates
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
      // TODO: Add API call to persist dataset addition
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
    loading,
    error,
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
