'use client';

import React, { Suspense, useState } from 'react';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <div className="flex-1 flex items-center justify-center p-12 text-xs text-surface-400">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};
