'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  FlaskConical,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

const operationalItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { name: 'All Cases', href: '/cases', icon: FolderOpen, exact: false },
  { name: 'New Intake', href: '/cases/new', icon: PlusCircle, exact: true },
];

const labItems: NavItem[] = [
  { name: 'Demo Lab', href: '/demo', icon: FlaskConical, exact: true, badge: '5 Tests' },
];

function NavGroup({
  label,
  items,
  onClose,
}: {
  label: string;
  items: NavItem[];
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-surface-400 uppercase">
        {label}
      </div>
      {items.map((item) => {
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
              'group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-brand-600" />
            )}
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-colors',
                isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200 text-surface-600 group-hover:bg-surface-300 transition-colors">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
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
          className="fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-xs lg:hidden"
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
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-surface-200 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-900 text-white shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-surface-900 leading-tight">
              ClaimScope
            </span>
            <span className="text-[10px] font-medium tracking-wider text-surface-400 uppercase">
              Investigation Platform
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
          <Suspense fallback={<div className="h-32 animate-pulse bg-surface-100 rounded-md" />}>
            <NavGroup label="Operations" items={operationalItems} onClose={onClose} />
            <div className="border-t border-surface-100 my-2" />
            <NavGroup label="Evaluation & Testing" items={labItems} onClose={onClose} />
          </Suspense>
        </nav>

        {/* System Version & Status */}
        <div className="shrink-0 border-t border-surface-200 p-3.5 bg-surface-50/70">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-surface-700">System Ready</span>
            </div>
            <span className="font-mono text-[10px] bg-surface-200/80 px-1.5 py-0.5 rounded text-surface-600">
              v1.0.0
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-surface-400 font-mono">
            <span>LangGraph Engine</span>
            <span>Gemini AI</span>
          </div>
        </div>
      </aside>
    </>
  );
};
