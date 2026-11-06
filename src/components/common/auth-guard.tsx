'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

/**
 * AuthGuard component wrapper.
 * Prevents rendering protected UI if the user is unauthenticated or missing an accessToken.
 * Displays a lightweight, branded loader while verifying session.
 */
export function AuthGuard({ children, fallbackMessage }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthGuard({
    message: fallbackMessage,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF7F2] p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-11 w-11 rounded-2xl bg-[#134E43]/10 flex items-center justify-center shadow-inner">
            <Loader2 className="h-5 w-5 animate-spin text-[#134E43]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">Verifying session...</p>
            <p className="text-xs text-zinc-500">Checking authentication token</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
