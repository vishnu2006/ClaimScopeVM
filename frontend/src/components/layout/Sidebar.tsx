'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Shield,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { name: 'Cases', href: '/cases', icon: FolderOpen, exact: false },
  { name: 'Create Case', href: '/cases/new', icon: PlusCircle, exact: true },
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href) && pathname !== '/cases/new');

        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-brand-600' : 'text-surface-400'
              )}
            />
            <span>{item.name}</span>
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />
            )}
          </Link>
        );
      })}
    </>
  );
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-sidebar flex flex-col border-r border-surface-200 bg-surface-0 transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-surface-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-subtle">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-surface-900 leading-tight">
              ClaimScope
            </span>
            <span className="text-[11px] font-medium tracking-wide text-surface-500 uppercase">
              Investigation AI
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-surface-400 uppercase">
            Investigation
          </div>
          <Suspense fallback={<div className="h-28 animate-pulse bg-surface-100 rounded-md" />}>
            <NavLinks onClose={onClose} />
          </Suspense>

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold tracking-wider text-surface-400 uppercase">
            Overview & Telemetry
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-xs text-surface-500">
              <Activity className="h-3.5 w-3.5 text-surface-400" />
              <span>Multi-Doc Reasoning</span>
            </div>
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-xs text-surface-500">
              <FileText className="h-3.5 w-3.5 text-surface-400" />
              <span>Document AI Parser</span>
            </div>
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-xs text-surface-500">
              <Layers className="h-3.5 w-3.5 text-surface-400" />
              <span>Cross-Ref Verification</span>
            </div>
          </div>
        </nav>

        {/* System Version & Status */}
        <div className="shrink-0 border-t border-surface-200 p-4 bg-surface-50/60">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
            <span className="font-medium text-surface-600">ClaimScope Core</span>
            <span className="font-mono text-[11px] bg-surface-200/70 px-1.5 py-0.5 rounded text-surface-700">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] text-surface-400 leading-tight">
            Auto Accident Claim Investigation Assistant
          </p>
        </div>
      </aside>
    </>
  );
};
