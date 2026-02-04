'use client';

import { AuthButton } from '@/components/auth/auth-button';
import { Logo } from '@/components/ui/logo';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-400">
      <div className="container-page pb-0">
        <div className="flex justify-between items-center pt-0.5 pb-0">
          <div className="flex items-center">
            <Logo className="h-5 w-auto" />
          </div>
          <AuthButton size="xs" />
        </div>
      </div>
    </header>
  );
}
