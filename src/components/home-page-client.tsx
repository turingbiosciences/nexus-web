"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FileUploader } from "@/components/file-upload/file-uploader";
import { DebugPanel } from "@/components/debug/debug-panel";
import { useSearchParams } from "next/navigation";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";
import { Dummy } from "./dummy/dummy";
import { UploadStatistics } from "@/components/upload/upload-statistics";
import { LoadingCard } from "@/components/ui/loading-card";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";

export function HomePageClient() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const { isAuthenticated, isLoading } = useGlobalAuth();

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
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
          </div>

          <Dummy />

          {isLoading ? (
            <LoadingCard />
          ) : !isAuthenticated ? (
            <SignInPrompt />
          ) : (
            <>
              <div className="card p-6">
                <FileUploader
                  maxSize={5 * 1024 * 1024 * 1024} // 5GB
                  onUploadComplete={(files) => {
                    console.log("Upload completed:", files);
                  }}
                  onUploadProgress={(fileId, progress) => {
                    console.log("Upload progress:", fileId, progress);
                  }}
                />
              </div>

              <UploadStatistics />
            </>
          )}
        </div>
      </main>
      <Footer />
      <DebugPanel />
    </div>
  );
}
