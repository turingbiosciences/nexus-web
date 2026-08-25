'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { logger } from '@/lib/logger';
import { Project } from '@/types/project';
import {
  fetchProjects,
  createProject as createProjectAPI,
  deleteProject as deleteProjectAPI,
} from '@/lib/api/projects';
import { getTokenErrorMessage } from '@/lib/api/utils';
import { useAuthState } from './auth-state-provider';

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
  addDataset: (projectId: string) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(
  undefined
);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  // Start with loading=true to prevent empty state flash during initial render
  // Set to false in three scenarios:
  // 1. After successful/failed fetch completion (line 139)
  // 2. When skipping fetch because already fetched or no token (lines 103-105)
  // 3. On token error (line 117)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // Track if we've attempted fetch
  const [previousAuthState, setPreviousAuthState] = useState<boolean>(false);
  const { isAuthenticated, authLoading } = useAuthState();

  logger.debug(
    {
      projectsCount: projects.length,
      loading,
      hasFetched,
      isAuthenticated,
      authLoading,
      error: error?.message,
    },
    'ProjectsProvider component render'
  );

  // Reset hasFetched and clear projects when the user signs in or out.
  useEffect(() => {
    // Only reset if auth state actually changed (user logged in/out)
    if (isAuthenticated !== previousAuthState) {
      setHasFetched(false);
      setProjects([]);
      setError(null);
      setPreviousAuthState(isAuthenticated);
    }
  }, [isAuthenticated, previousAuthState]);

  useEffect(() => {
    logger.debug(
      { isAuthenticated, authLoading, hasFetched },
      'ProjectsProvider useEffect triggered'
    );

    // Don't fetch until we know the user is signed in, and only once.
    //
    // There is no longer a separate token-error state to handle here: the
    // client holds no token, so the only failure left is the fetch itself,
    // which the catch below already covers.
    if (!isAuthenticated || authLoading || hasFetched) {
      logger.debug(
        {
          reason: !isAuthenticated
            ? 'not authenticated'
            : authLoading
              ? 'auth loading'
              : 'already fetched',
        },
        'ProjectsProvider skipping fetch'
      );
      // If we're not going to fetch and not waiting on auth, stop loading
      if (hasFetched || (!isAuthenticated && !authLoading)) {
        setLoading(false);
      }
      return;
    }

    logger.debug('ProjectsProvider starting fetch');
    setLoading(true);
    setError(null);

    (async () => {
      try {
        logger.debug('Fetching projects');
        const fetchedProjects = await fetchProjects();
        logger.info(
          { count: fetchedProjects.length },
          'ProjectsProvider fetch successful'
        );
        setProjects(fetchedProjects);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err) || 'Unknown error';
        logger.error(errorMessage, 'ProjectsProvider failed to fetch projects');
        setError(err instanceof Error ? err : new Error(errorMessage));
        setProjects([]);
      } finally {
        setLoading(false);
        setHasFetched(true); // Mark as attempted regardless of success/failure
      }
    })();
  }, [isAuthenticated, authLoading, hasFetched]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      logger.debug(
        { isAuthenticated, authLoading },
        'ProjectsProvider createProject called'
      );

      if (authLoading) {
        throw new Error('Authentication loading. Please wait and try again.');
      }

      if (!isAuthenticated) {
        const errorMsg = getTokenErrorMessage();
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        logger.debug({ name: data.name }, 'Creating project');
        const newProject = await createProjectAPI(data);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        logger.error(
          { error: err },
          'ProjectsProvider failed to create project'
        );
        throw err;
      }
    },
    [isAuthenticated, authLoading]
  );

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const now = new Date();
        return {
          ...p,
          ...updates,
          updatedAt: updates.updatedAt ? updates.updatedAt : now,
        };
      })
    );
    // TODO: Add API call to persist updates
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      logger.debug(
        { projectId: id, isAuthenticated, authLoading },
        'ProjectsProvider deleteProject called'
      );

      if (authLoading) {
        throw new Error('Authentication loading. Please wait and try again.');
      }

      if (!isAuthenticated) {
        const errorMsg = getTokenErrorMessage();
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        logger.debug({ projectId: id }, 'Deleting project');
        await deleteProjectAPI(id);
        // Remove from local state after successful deletion
        setProjects((prev) => prev.filter((p) => p.id !== id));
        logger.info({ projectId: id }, 'Project deleted successfully');
      } catch (err) {
        logger.error({ error: err, projectId: id }, 'Failed to delete project');
        throw err;
      }
    },
    [isAuthenticated, authLoading]
  );

  const addDataset = useCallback((projectId: string) => {
    // Optimistically increment dataset count
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const now = new Date();
        return {
          ...p,
          datasetCount: (p.datasetCount || 0) + 1,
          updatedAt: now,
          lastActivity: 'just now',
        };
      })
    );
    // Note: Actual dataset list is fetched separately via useDatasets hook
  }, []);

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const value: ProjectsContextValue = useMemo(
    () => ({
      projects,
      loading,
      error,
      createProject,
      updateProject,
      deleteProject,
      getProjectById,
      addDataset,
    }),
    [
      projects,
      loading,
      error,
      createProject,
      updateProject,
      deleteProject,
      getProjectById,
      addDataset,
    ]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx)
    throw new Error('useProjects must be used within a ProjectsProvider');
  return ctx;
}
