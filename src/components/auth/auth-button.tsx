"use client";

import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalAuth } from "@/components/providers/global-auth-provider";

export function AuthButton() {
  const { isAuthenticated, isLoading } = useGlobalAuth();

  const handleSignIn = () => {
    // Use API route directly (same as home page link)
    window.location.href = "/api/logto/sign-in";
  };

  const handleSignOut = async () => {
    try {
      // First try the standard Logto sign-out
      try {
        const response = await fetch("/api/logto/sign-out", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok || response.status === 307) {
          // If successful or redirect, follow the redirect
          window.location.href = "/api/logto/sign-out";
          return;
        }
      } catch (error) {
        console.warn(
          "Standard sign-out failed, trying manual sign-out:",
          error
        );
      }

      // Fallback to manual sign-out
      try {
        const manualResponse = await fetch("/api/logto/manual-sign-out", {
          method: "POST",
          credentials: "include",
        });

        if (manualResponse.ok) {
          // Manual sign-out successful, reload the page
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error("Manual sign-out also failed:", error);
      }

      // Last resort: just reload the page
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
      // If everything fails, just reload
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <Button disabled>
        <User className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button onClick={handleSignOut} variant="outline">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}
