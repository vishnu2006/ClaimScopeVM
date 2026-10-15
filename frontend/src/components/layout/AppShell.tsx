'use client';

import React, { Suspense, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Public homepage at '/' renders without the internal sidebar
  const isPublicPage = pathname === '/';

  if (isPublicPage) {
    return (
      <main className="min-h-screen flex flex-col bg-surface-50 text-surface-900">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-800 flex">
      {/* Sidebar for desktop & mobile drawer */}
      <Suspense
        fallback={
          <aside className="fixed inset-y-0 left-0 z-40 w-sidebar border-r border-surface-200 bg-surface-0 hidden lg:block" />
        }
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>

      {/* Main wrapper offset by sidebar width on lg screens */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-sidebar transition-[padding] duration-200">
        <main className="flex-1 min-h-screen flex flex-col">
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
