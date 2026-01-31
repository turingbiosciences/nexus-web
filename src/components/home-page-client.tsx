'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DebugPanel } from '@/components/debug/debug-panel';
import { useSearchParams } from 'next/navigation';
import { useAccessToken } from '@/components/providers/token-provider';
import { LoadingCard } from '@/components/ui/loading-card';
import { SignInPrompt } from '@/components/auth/sign-in-prompt';
import { useProjects } from '@/components/providers/projects-provider';
import { useState } from 'react';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { logger } from '@/lib/logger';
import { Plus, FolderOpen, Play, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/lib/queries/dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils/format-date';

// Mock runs data - will be replaced with API data
const MOCK_RUNS = [
  {
    id: 'run-1',
    projectName: 'sJIA Metabolites Analysis',
    projectId: '1',
    algorithm: 'Random Forest',
    status: 'completed' as const,
    runtime: 45,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'run-2',
    projectName: 'Cancer Cell Line Screening',
    projectId: '4',
    algorithm: 'XGBoost',
    status: 'running' as const,
    runtime: 23,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'run-3',
    projectName: 'Diabetes Risk Prediction',
    projectId: '5',
    algorithm: 'LightGBM',
    status: 'completed' as const,
    runtime: 67,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'run-4',
    projectName: 'COVID-19 Proteomics',
    projectId: '2',
    algorithm: 'CatBoost',
    status: 'completed' as const,
    runtime: 89,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

function formatRuntime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function StatBlock({
  title,
  value,
  icon: Icon,
  children,
}: {
  title: string;
  value?: string | number | React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      {value !== undefined ? (
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      ) : (
        children
      )}
    </div>
  );
}

export function HomePageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const { isAuthenticated, authLoading } = useAccessToken();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useProjects();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const isLoading = authLoading || projectsLoading;

  logger.debug(
    {
      isAuthenticated,
      authLoading,
      projectsLoading,
      isLoading,
      projectsCount: projects.length,
    },
    'HomePageClient render state'
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container-page py-8 flex-1">
        {authError === 'auth_failed' && (
          <div className="alert-error mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>There was an error signing you in. Please try again.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <LoadingCard />
          ) : !isAuthenticated ? (
            <SignInPrompt />
          ) : (
            <>
              {/* Projects Error Alert */}
              {projectsError && (
                <div className="alert-error mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Failed to Load Projects
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{projectsError.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatBlock
                  title="Total Projects"
                  value={
                    statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      (stats?.total_projects ?? projects.length)
                    )
                  }
                  icon={FolderOpen}
                />
                <StatBlock
                  title="Total ML Runs"
                  value={
                    statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      (stats?.total_ml_runs ?? '-')
                    )
                  }
                  icon={Play}
                />
                <StatBlock title="Algorithm Wins" icon={Trophy}>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {stats &&
                        Object.entries(stats.algorithm_wins).map(
                          ([algo, wins]) => (
                            <div key={algo} className="flex justify-between">
                              <span className="text-gray-600 truncate capitalize">
                                {algo.replace('_', ' ')}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {wins}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </StatBlock>
                <StatBlock
                  title="Total Runtime"
                  value={
                    statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : stats ? (
                      formatRuntime(
                        Math.round(stats.total_runtime_seconds / 60)
                      )
                    ) : (
                      '-'
                    )
                  }
                  icon={Clock}
                />
              </div>

              {/* Row 2: Two-column layout */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                {/* Column 1: Runs List (wider) */}
                <div className="lg:col-span-3 flex flex-col min-h-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Recent ML Runs
                      </h2>
                      <p className="text-sm text-gray-600">
                        All training runs across projects
                      </p>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Algorithm
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Runtime
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Started
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {MOCK_RUNS.map((run) => (
                            <tr
                              key={run.id}
                              className="hover:bg-gray-50 cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <a
                                  href={`/projects/${run.projectId}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                  {run.projectName}
                                </a>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {run.algorithm}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    run.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : run.status === 'running'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {run.status === 'running' && (
                                    <span className="w-2 h-2 mr-1.5 bg-blue-500 rounded-full animate-pulse" />
                                  )}
                                  {run.status.charAt(0).toUpperCase() +
                                    run.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {run.runtime}m
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDateTime(run.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Column 2: Projects List (narrower) */}
                <div className="lg:col-span-1 flex flex-col min-h-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Projects
                        </h2>
                        <Button
                          size="sm"
                          onClick={() => setDialogOpen(true)}
                          className="h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {projects.length} project
                        {projects.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      {projects.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No projects yet</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Create your first project
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {projects.map((project) => (
                            <li key={project.id}>
                              <a
                                href={`/projects/${project.id}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                              >
                                <div className="font-medium text-gray-900 text-sm truncate">
                                  {project.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                  <span>
                                    {project.datasetCount || 0} dataset
                                    {project.datasetCount !== 1 ? 's' : ''}
                                  </span>
                                  {project.lastActivity && (
                                    <>
                                      <span>•</span>
                                      <span>{project.lastActivity}</span>
                                    </>
                                  )}
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <NewProjectDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={(id) => {
                  logger.info({ projectId: id }, 'Project created via dialog');
                }}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
      <DebugPanel />
    </div>
  );
}
