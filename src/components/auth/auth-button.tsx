"use client";

import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogto } from "@logto/react";

export function AuthButton() {
  const { isAuthenticated, isLoading } = useLogto();

  const handleSignIn = () => {
    // Use API route directly (same as home page link)
    window.location.href = "/api/logto/sign-in";
  };

  const handleSignOut = async () => {
    // Simply navigate to the Logto sign-out endpoint
    // It will handle the redirect to Logto and back
    window.location.href = "/api/logto/sign-out";
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
