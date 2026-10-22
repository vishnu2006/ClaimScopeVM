'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { WorkspaceNavbar } from './WorkspaceNavbar';
import { TargetCursor } from '@/components/ui/TargetCursor';

export interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public homepage at '/' renders without the internal horizontal workspace navbar
  const isPublicPage = pathname === '/';

  if (isPublicPage) {
    return (
      <main className="min-h-screen flex flex-col bg-surface-50 text-surface-900">
        <TargetCursor
          targetSelector=".cursor-target"
          cursorColor="#086afc"
          cursorColorOnTarget="#5eba46"
          spinDuration={4.5}
          hoverDuration={0.2}
          parallaxOn={true}
          hideDefaultCursor={false}
          size={20}
          cornerSize={8}
          thickness={2}
          padding={5}
          matchRadius={true}
          dotSize={3.5}
          showLabel={true}
          clickEffect={true}
        />
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-800 flex flex-col">
      <TargetCursor
        targetSelector=".cursor-target"
        cursorColor="#086afc"
        cursorColorOnTarget="#5eba46"
        spinDuration={4.5}
        hoverDuration={0.2}
        parallaxOn={true}
        hideDefaultCursor={false}
        size={20}
        cornerSize={8}
        thickness={2}
        padding={5}
        matchRadius={true}
        dotSize={3.5}
        showLabel={true}
        clickEffect={true}
      />
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

