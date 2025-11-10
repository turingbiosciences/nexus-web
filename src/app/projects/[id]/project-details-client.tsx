"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
// Use projects provider for dynamic state
import { useProjects } from "@/components/providers/projects-provider";
import { useAccessToken } from "@/components/providers/token-provider";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { LoadingCard } from "@/components/ui/loading-card";
import { Button } from "@/components/ui/button";
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab";
import { ProjectSettingsTab } from "@/components/projects/project-settings-tab";
import {
  ArrowLeft,
  Settings,
  CheckCircle,
  Play,
  Settings2,
  Calendar,
  Database,
  Clock,
} from "lucide-react";

interface ProjectDetailsClientProps {
  projectId: string;
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    label: "Complete",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  running: {
    icon: Play,
    label: "Running",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  setup: {
    icon: Settings2,
    label: "Setup",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
};

export function ProjectDetailsClient({ projectId }: ProjectDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAccessToken();
  const [activeTab, setActiveTab] = useState<"overview" | "settings">(
    "overview"
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    getProjectById,
    updateProject,
    deleteProject,
    loading: projectsLoading,
    projects,
  } = useProjects();
  const project = getProjectById(projectId);

  // Determine if we're in an initial loading state
  // Show loading if: auth loading, projects loading, OR (no projects data yet AND authenticated)
  const isInitialLoading =
    authLoading ||
    projectsLoading ||
    (isAuthenticated && projects.length === 0 && !project);

  console.log("[ProjectDetailsClient] Render state:", {
    authLoading,
    projectsLoading,
    isInitialLoading,
    hasProject: !!project,
    projectsCount: projects.length,
    projectId,
  });

  const handleDeleteProject = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      // Navigate back to home after successful deletion
      router.push("/");
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert(
        `Failed to delete project: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsDeleting(false);
    }
  };

  // Show loading state while initially loading
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="container-page py-8">
          <LoadingCard />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="container-page py-8">
          <SignInPrompt />
        </main>
        <Footer />
      </div>
    );
  }

  // Only show "not found" after loading is complete
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="container-page py-8">
          <div className="card text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The project you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Default to 'setup' if status is undefined or invalid
  const config = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container-page py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          {/* Project Header */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color} ${config.border} border`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                </div>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Project Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="font-medium text-gray-900">
                    {project.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="font-medium text-gray-900">
                    {project.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Datasets</div>
                  <div className="font-medium text-gray-900">
                    {project.datasetCount || 0}
                  </div>
                </div>
              </div>
              {project.completedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="font-medium text-gray-900">
                      {project.completedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "settings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" ? (
            <ProjectOverviewTab projectId={project.id} />
          ) : (
            <ProjectSettingsTab
              project={project}
              onUpdateProject={updateProject}
              onDeleteProject={handleDeleteProject}
              isDeleting={isDeleting}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
