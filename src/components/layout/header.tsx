'use client';

import { AuthButton } from '@/components/auth/auth-button';
import { Logo } from '@/components/ui/logo';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container-page">
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          <AuthButton size="sm" />
        </div>
      </div>
    </header>
  );
}
