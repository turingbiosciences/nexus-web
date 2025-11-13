"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { logger } from "@/lib/logger";
import {
  Project,
  ProjectStatusCount,
  STATUS_ORDER,
  ProjectActivity,
} from "@/types/project";
import {
  fetchProjects,
  createProject as createProjectAPI,
  deleteProject as deleteProjectAPI,
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
  deleteProject: (id: string) => Promise<void>;
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
  const [hasFetched, setHasFetched] = useState(false); // Track if we've attempted fetch
  const [previousAuthState, setPreviousAuthState] = useState<boolean>(false);
  const {
    accessToken,
    isLoading: tokenLoading,
    error: tokenError,
  } = useAccessToken();

  logger.debug(
    {
      projectsCount: projects.length,
      loading,
      hasFetched,
      hasToken: !!accessToken,
      tokenLoading,
      error: error?.message,
    },
    "ProjectsProvider component render"
  );

  // Track authentication state (boolean) to detect user switching, not token refresh
  const isAuthenticated = !!accessToken;

  // Reset hasFetched and clear projects only when authentication state changes
  // (false → true or true → false), not when token value changes for same session
  useEffect(() => {
    // Only reset if auth state actually changed (user logged in/out)
    if (isAuthenticated !== previousAuthState) {
      setHasFetched(false);
      setProjects([]);
      setError(null);
      setPreviousAuthState(isAuthenticated);
    }
  }, [isAuthenticated, previousAuthState]); // Only reacts to auth state transitions, not token refreshes

  useEffect(() => {
    logger.debug(
      {
        hasToken: !!accessToken,
        tokenLoading,
        hasFetched,
        tokenError: tokenError?.message,
      },
      "ProjectsProvider useEffect triggered"
    );

    // Don't fetch if no token, token still loading, or already attempted fetch
    if (!accessToken || tokenLoading || hasFetched) {
      logger.debug(
        {
          reason: !accessToken
            ? "no token"
            : tokenLoading
            ? "token loading"
            : "already fetched",
        },
        "ProjectsProvider skipping fetch"
      );
      return;
    }

    // If there's a token error, set it and don't fetch
    if (tokenError) {
      logger.error(
        { error: tokenError },
        "ProjectsProvider token error detected"
      );
      setError(tokenError);
      setHasFetched(true); // Mark as attempted to prevent retry loop
      return;
    }

    logger.debug("ProjectsProvider starting fetch");
    setLoading(true);
    setError(null);

    (async () => {
      try {
        logger.debug("Fetching projects with cached token");
        const fetchedProjects = await fetchProjects(accessToken);
        logger.info(
          { count: fetchedProjects.length },
          "ProjectsProvider fetch successful"
        );
        setProjects(fetchedProjects);
      } catch (err) {
        logger.error(
          { error: err },
          "ProjectsProvider failed to fetch projects"
        );
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setProjects([]);
      } finally {
        setLoading(false);
        setHasFetched(true); // Mark as attempted regardless of success/failure
      }
    })();
  }, [accessToken, tokenLoading, tokenError, hasFetched]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      logger.debug(
        {
          hasToken: !!accessToken,
          tokenLength: accessToken?.length,
          tokenLoading,
          tokenError: tokenError?.message,
        },
        "ProjectsProvider createProject called"
      );

      // Check if token is available
      if (!accessToken) {
        const errorMsg = tokenError
          ? `Authentication error: ${tokenError.message}`
          : "Authentication token unavailable. Please sign out and sign back in to obtain an access token.";
        logger.error({ tokenError }, errorMsg);
        throw new Error(errorMsg);
      }

      if (tokenLoading) {
        throw new Error("Authentication loading. Please wait and try again.");
      }

      try {
        logger.debug({ name: data.name }, "Creating project with cached token");
        const newProject = await createProjectAPI(accessToken, data);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        logger.error(
          { error: err },
          "ProjectsProvider failed to create project"
        );
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

  const deleteProject = useCallback(
    async (id: string) => {
      logger.debug(
        {
          projectId: id,
          hasToken: !!accessToken,
          tokenLoading,
          tokenError: tokenError?.message,
        },
        "ProjectsProvider deleteProject called"
      );

      // Check if token is available
      if (!accessToken) {
        const errorMsg = tokenError
          ? `Authentication error: ${tokenError.message}`
          : "Authentication token unavailable. Please sign out and sign back in to obtain an access token.";
        logger.error({ tokenError }, errorMsg);
        throw new Error(errorMsg);
      }

      if (tokenLoading) {
        throw new Error("Authentication loading. Please wait and try again.");
      }

      try {
        logger.debug({ projectId: id }, "Deleting project with cached token");
        await deleteProjectAPI(accessToken, id);
        // Remove from local state after successful deletion
        setProjects((prev) => prev.filter((p) => p.id !== id));
        logger.info({ projectId: id }, "Project deleted successfully");
      } catch (err) {
        logger.error({ error: err, projectId: id }, "Failed to delete project");
        throw err;
      }
    },
    [accessToken, tokenLoading, tokenError]
  );

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
    deleteProject,
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
