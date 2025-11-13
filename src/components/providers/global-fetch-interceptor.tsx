"use client";

import { useEffect } from "react";
import { installGlobalFetchInterceptor } from "@/lib/global-fetch-handler";

/**
 * Component that installs the global fetch interceptor on mount.
 * This automatically handles token expiration for ALL fetch calls in the app.
 */
export function GlobalFetchInterceptor() {
  useEffect(() => {
    // Install the global fetch interceptor
    installGlobalFetchInterceptor();

    // Note: We don't uninstall on unmount because this should be global for the entire app lifecycle
  }, []);

  return null; // This component renders nothing
}
