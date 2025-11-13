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
import { ProjectResultsTab } from "@/components/projects/project-results-tab";
import { ProjectActivityTab } from "@/components/projects/project-activity-tab";
import { ProjectDatasetsTab } from "@/components/projects/project-datasets-tab";
import { ProjectSettingsTab } from "@/components/projects/project-settings-tab";
import { ProjectHeaderCard } from "@/components/projects/project-header-card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { authFetch } from "@/lib/auth-fetch";

interface ProjectDetailsClientProps {
  projectId: string;
}

export function ProjectDetailsClient({ projectId }: ProjectDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated, authLoading, accessToken, refreshToken } =
    useAccessToken();
  const { push: pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "activity" | "datasets" | "settings"
  >("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

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

  const handleRun = async () => {
    if (!project || !accessToken) return;

    setIsRunning(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_TURING_API;
      const response = await authFetch(
        `${baseUrl}/projects/${project.id}/train`,
        {
          method: "GET",
          token: accessToken,
          onTokenRefresh: refreshToken,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      // Display response in toast that must be manually closed (duration: 0)
      pushToast({
        title: response.ok ? "Training Started" : "Training Error",
        description: JSON.stringify(data, null, 2),
        variant: response.ok ? "default" : "destructive",
        duration: 0, // Must be manually closed
      });
    } catch (err) {
      pushToast({
        title: "Request Failed",
        description: `Error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        variant: "destructive",
        duration: 0,
      });
    } finally {
      setIsRunning(false);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container-page py-8 space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <ProjectHeaderCard
          project={project}
          isRunning={isRunning}
          onRun={handleRun}
        />

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
              onClick={() => setActiveTab("results")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "results"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activity"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("datasets")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "datasets"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Datasets
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
        ) : activeTab === "results" ? (
          <ProjectResultsTab projectId={project.id} />
        ) : activeTab === "activity" ? (
          <ProjectActivityTab projectId={project.id} />
        ) : activeTab === "datasets" ? (
          <ProjectDatasetsTab projectId={project.id} />
        ) : (
          <ProjectSettingsTab
            project={project}
            onUpdateProject={updateProject}
            onDeleteProject={handleDeleteProject}
            isDeleting={isDeleting}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
