'use client';

import React, { Suspense, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { WorkspaceNavbar } from './WorkspaceNavbar';
import { useAuth } from '@/context/AuthContext';

export interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isConfigured } = useAuth();

  // Public homepage
  const isPublicPage = pathname === '/';

  // Dedicated Auth Pages
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password';

  // Route protection for internal workspace
  useEffect(() => {
    if (!isPublicPage && !isAuthPage && !loading && isConfigured && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isPublicPage, isAuthPage, loading, isConfigured, user, pathname, router]);

  if (isPublicPage || isAuthPage) {
    return (
      <main className="min-h-screen flex flex-col bg-surface-50 dark:bg-[#0c1322] text-surface-900">
        {children}
      </main>
    );
  }

  // Prevent flicker during initial session restoration
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-[#0c1322] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl brand-logo-container p-1.5 animate-pulse">
            <Image
              src="/brand/vmlogo.png"
              alt="ClaimScope"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-surface-500 animate-pulse">
            Restoring ClaimScope session...
          </span>
        </div>
      </div>
    );
  }

  // If configured and not authenticated on a protected route, show redirecting state
  if (isConfigured && !user) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-[#0c1322] flex items-center justify-center">
        <div className="text-xs text-surface-400">Redirecting to sign in...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0c1322] text-surface-800 flex flex-col">
      {/* Refined Enterprise Horizontal Workspace Header */}
      <Suspense
        fallback={
          <header className="h-16 border-b border-surface-200 bg-surface-0 w-full animate-pulse" />
        }
      >
        <WorkspaceNavbar />
      </Suspense>

      {/* Full-width Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-surface-400">
              Loading workspace...
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 text-surface-800" />}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
};
