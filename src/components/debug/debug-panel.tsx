"use client";

import { useEffect, useState } from "react";

interface UserData {
  id?: string;
  username?: string;
  primaryEmail?: string;
  name?: string;
  picture?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  customData?: Record<string, unknown>;
  identities?: Array<{
    userId: string;
    details: Record<string, unknown>;
  }>;
  profile?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  lastSignInAt?: string;
  applicationId?: string;
  isSuspended?: boolean;
  [key: string]: unknown;
}

export function DebugPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized
  const [height, setHeight] = useState(384); // 96 * 4 = 384px (max-h-96)
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled
    setIsDebugMode(process.env.NEXT_PUBLIC_TBIO_DEBUG === "true");
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 100)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/logto/user");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.ok) {
          const userInfo = await response.json();
          const isAuth = userInfo.isAuthenticated;
          setIsAuthenticated(isAuth);
          setUserData(userInfo);
        } else {
          setUserData(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setUserData(null);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Don't render if debug mode is disabled
  if (!isDebugMode) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-700 z-50 flex flex-col"
      style={{ height: isMinimized ? "auto" : `${height}px` }}
    >
      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className="h-1 bg-gray-700 hover:bg-blue-500 cursor-ns-resize active:bg-blue-600 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400">
          🐛 Debug Panel
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300">
            TBIO_DEBUG: {isDebugMode ? "ENABLED" : "DISABLED"}
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {isMinimized ? "Expand ▲" : "Minimize ▼"}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Authentication Status */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-400 mb-2">
                  Authentication Status
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Authenticated:</span>
                    <span
                      className={
                        isAuthenticated ? "text-green-400" : "text-red-400"
                      }
                    >
                      {isAuthenticated ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span
                      className={
                        isLoading ? "text-yellow-400" : "text-gray-400"
                      }
                    >
                      {isLoading ? "YES" : "NO"}
                    </span>
                  </div>
                  {error && (
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span
                        className="text-red-400 truncate"
                        title={error.message}
                      >
                        {error.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Data */}
              <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-400 mb-2">
                  User Data
                </h4>
                {userData ? (
                  <div className="space-y-1 text-xs">
                    {userData.id && (
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span
                          className="text-gray-300 font-mono truncate"
                          title={userData.id}
                        >
                          {userData.id}
                        </span>
                      </div>
                    )}
                    {userData.username && (
                      <div className="flex justify-between">
                        <span>Username:</span>
                        <span className="text-gray-300">
                          {userData.username}
                        </span>
                      </div>
                    )}
                    {userData.primaryEmail && (
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="text-gray-300">
                          {userData.primaryEmail}
                        </span>
                      </div>
                    )}
                    {userData.name && (
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="text-gray-300">{userData.name}</span>
                      </div>
                    )}
                    {userData.emailVerified !== undefined && (
                      <div className="flex justify-between">
                        <span>Email Verified:</span>
                        <span
                          className={
                            userData.emailVerified
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {userData.emailVerified ? "YES" : "NO"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">
                    No user data available
                  </div>
                )}
              </div>
            </div>

            {/* Full User Data JSON */}
            {userData && (
              <div className="mt-4 bg-gray-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-purple-400 mb-2">
                  Complete User Data (JSON)
                </h4>
                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}

            {/* Environment Info */}
            <div className="mt-4 bg-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-orange-400 mb-2">
                Environment Info
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-gray-300">{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logto Endpoint:</span>
                  <span
                    className="text-gray-300 font-mono truncate"
                    title={process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}
                  >
                    {process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Logto App ID:</span>
                  <span
                    className="text-gray-300 font-mono truncate"
                    title={process.env.NEXT_PUBLIC_LOGTO_APP_ID}
                  >
                    {process.env.NEXT_PUBLIC_LOGTO_APP_ID}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
