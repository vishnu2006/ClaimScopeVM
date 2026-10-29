'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { WorkspaceNavbar } from './WorkspaceNavbar';

export interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public or Dedicated Auth Pages
  const isPublicPage = pathname === '/';
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password';

  if (isPublicPage || isAuthPage) {
    return (
      <main className="min-h-screen flex flex-col bg-surface-50 dark:bg-[#0c1322] text-surface-900">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0c1322] text-surface-800 flex flex-col">
      {/* Clean Horizontal Workspace Header */}
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
