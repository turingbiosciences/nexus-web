'use client';

import { LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/components/providers/auth-state-provider';

interface AuthButtonProps {
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export function AuthButton({ size = 'default' }: AuthButtonProps) {
  const { isAuthenticated, authLoading: isLoading } = useAuthState();

  const handleSignIn = () => {
    // Use API route directly (same as home page link)
    window.location.href = '/api/logto/sign-in';
  };

  const handleSignOut = async () => {
    // Simply navigate to the Logto sign-out endpoint
    // It will handle the redirect to Logto and back
    window.location.href = '/api/logto/sign-out';
  };

  if (isLoading) {
    return (
      <Button disabled size={size}>
        <User className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button onClick={handleSignOut} variant="outline" size={size}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button onClick={handleSignIn} size={size}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}
