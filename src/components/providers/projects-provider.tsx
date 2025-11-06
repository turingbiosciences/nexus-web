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
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessToken,
  } = useLogto();

  useEffect(() => {
    // Don't fetch if not authenticated, still loading auth, already loading, or already have projects
    if (!isAuthenticated || authLoading || loading || projects.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Get access token for API resource
        // Try with resource first, fallback to no resource if that fails
        let token: string | undefined;
        const resource = process.env.NEXT_PUBLIC_TURING_API;

        console.log(
          "[ProjectsProvider] Fetching projects - attempting to get access token...",
          {
            resource,
            hasResource: !!resource,
            isAuthenticated,
            authLoading,
          }
        );

        try {
          token = await getAccessToken(resource);
          console.log("[ProjectsProvider] Got token with resource for fetch:", {
            hasToken: !!token,
          });
        } catch (err) {
          console.warn(
            "[ProjectsProvider] Failed to get access token with resource for fetch, trying without resource:",
            err
          );
          try {
            token = await getAccessToken();
            console.log(
              "[ProjectsProvider] Got token without resource for fetch:",
              { hasToken: !!token }
            );
          } catch (fallbackErr) {
            console.error(
              "[ProjectsProvider] Failed to get token even without resource for fetch:",
              fallbackErr
            );
          }
        }

        if (!token) {
          console.error(
            "[ProjectsProvider] No token available for fetch. User may need to re-authenticate."
          );
          throw new Error(
            "Authentication token unavailable. Please sign out and sign back in, then try again."
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
  }, [isAuthenticated, authLoading, loading, projects.length, getAccessToken]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      // Check authentication state first
      if (!isAuthenticated) {
        throw new Error("You must be signed in to create a project.");
      }

      if (authLoading) {
        throw new Error(
          "Authentication still loading. Please wait and try again."
        );
      }

      try {
        // Get access token for API resource
        // Try with resource first, fallback to no resource if that fails
        let token: string | undefined;
        const resource = process.env.NEXT_PUBLIC_TURING_API;

        console.log("[ProjectsProvider] Attempting to get access token...", {
          resource,
          hasResource: !!resource,
          isAuthenticated,
          authLoading,
        });

        try {
          token = await getAccessToken(resource);
          console.log("[ProjectsProvider] Got token with resource:", {
            hasToken: !!token,
          });
        } catch (err) {
          console.warn(
            "[ProjectsProvider] Failed to get access token with resource, trying without resource:",
            err
          );
          try {
            token = await getAccessToken();
            console.log("[ProjectsProvider] Got token without resource:", {
              hasToken: !!token,
            });
          } catch (fallbackErr) {
            console.error(
              "[ProjectsProvider] Failed to get token even without resource:",
              fallbackErr
            );
          }
        }

        if (!token) {
          console.error(
            "[ProjectsProvider] No token available. User may need to re-authenticate."
          );
          throw new Error(
            "Authentication token unavailable. Please sign out and sign back in, then try again."
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
    [isAuthenticated, authLoading, getAccessToken]
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
