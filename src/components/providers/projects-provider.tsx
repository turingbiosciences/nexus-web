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
import { useAccessToken } from "./token-provider";

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
  const {
    accessToken,
    isLoading: tokenLoading,
    error: tokenError,
  } = useAccessToken();

  useEffect(() => {
    // Don't fetch if no token, token still loading, already loading, or already have projects
    if (!accessToken || tokenLoading || loading || projects.length > 0) {
      return;
    }

    // If there's a token error, set it and don't fetch
    if (tokenError) {
      setError(tokenError);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        console.log("[ProjectsProvider] Fetching projects with cached token");
        const fetchedProjects = await fetchProjects(accessToken);
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("[ProjectsProvider] Failed to fetch projects:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, tokenLoading, tokenError, loading, projects.length]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      console.log("[ProjectsProvider] createProject called", {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length,
        tokenLoading,
        tokenError: tokenError?.message,
      });

      // Check if token is available
      if (!accessToken) {
        const errorMsg = tokenError
          ? `Authentication error: ${tokenError.message}`
          : "Authentication token unavailable. Please sign out and sign back in to obtain an access token.";
        console.error("[ProjectsProvider]", errorMsg);
        throw new Error(errorMsg);
      }

      if (tokenLoading) {
        throw new Error("Authentication loading. Please wait and try again.");
      }

      try {
        console.log("[ProjectsProvider] Creating project with cached token");
        const newProject = await createProjectAPI(accessToken, data);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        console.error("[ProjectsProvider] Failed to create project:", err);
        throw err;
      }
    },
    [accessToken, tokenLoading, tokenError]
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
