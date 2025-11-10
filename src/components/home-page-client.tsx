"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DebugPanel } from "@/components/debug/debug-panel";
import { useSearchParams } from "next/navigation";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";
import { LoadingCard } from "@/components/ui/loading-card";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectStatusChart } from "@/components/projects/project-status-chart";
// Projects come from provider now
import { useProjects } from "@/components/providers/projects-provider";
import { useState } from "react";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomePageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const { isAuthenticated, isLoading: authLoading } = useGlobalAuth();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    getStatusCounts,
  } = useProjects();
  const statusCount = getStatusCounts();

  const isLoading = authLoading || projectsLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container-page py-8">
        {authError === "auth_failed" && (
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

        <div className="space-y-8">
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

              {/* Dashboard Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                  <p className="text-gray-600 mt-1">
                    Manage and monitor your biosciences research projects
                  </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Chart - Left sidebar */}
                <div className="lg:col-span-1">
                  <ProjectStatusChart statusCount={statusCount} />
                </div>

                {/* Project List - Main content */}
                <div className="lg:col-span-2">
                  <ProjectList projects={projects} />
                </div>
              </div>
              <NewProjectDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={(id) => {
                  // Optional: navigate to new project detail page
                  console.log("Project created", id);
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
