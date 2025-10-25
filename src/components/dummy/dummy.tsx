"use client";

import { useGlobalAuth } from "@/components/providers/global-auth-provider";
import { useEffect, useState } from "react";

export function Dummy() {
  const { isAuthenticated, isLoading } = useGlobalAuth();
  // resolvedAuth: null (pending), true, false
  const [resolvedAuth, setResolvedAuth] = useState<boolean | null>(null);
  const [bridgeTried, setBridgeTried] = useState(false);

  useEffect(() => {
    // If provider still loading, defer.
    if (isLoading) {
      return;
    }
    // If provider already reports authenticated, accept immediately.
    if (isAuthenticated) {
      setResolvedAuth(true);
      return;
    }
    // Attempt one server-side bridge fetch if unauthenticated after loading.
    if (!bridgeTried) {
      setBridgeTried(true);
      let cancelled = false;
      (async () => {
        try {
          const resp = await fetch("/api/logto/user", {
            credentials: "include",
            headers: { "cache-control": "no-store" },
          });
          if (!cancelled) {
            setResolvedAuth(resp.ok);
          }
        } catch {
          if (!cancelled) {
            setResolvedAuth(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    // If bridge tried and still not authenticated, finalize false.
    setResolvedAuth(false);
  }, [isLoading, isAuthenticated, bridgeTried]);

  if (resolvedAuth === null) {
    return <div>Loading authentication…</div>;
  }

  return <div>{resolvedAuth ? "Authenticated" : "Not authenticated"}</div>;
}
