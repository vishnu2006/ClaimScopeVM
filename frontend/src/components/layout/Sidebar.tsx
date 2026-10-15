'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  FileText,
  Search,
  GitCompare,
  FileCheck2,
  Cpu,
  FlaskConical,
  Shield,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

const workspaceItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'All Cases', href: '/cases', icon: FolderOpen, exact: false },
  { name: 'New Investigation', href: '/cases/new', icon: PlusCircle, exact: true },
];

const investigationItems: NavItem[] = [
  { name: 'Document Intelligence', href: '/documents', icon: FileText, exact: true },
  { name: 'Evidence Analysis', href: '/evidence', icon: Search, exact: true },
  { name: 'Discrepancy Review', href: '/discrepancies', icon: GitCompare, exact: true },
  { name: 'Investigation Reports', href: '/reports', icon: FileCheck2, exact: true },
];

const platformItems: NavItem[] = [
  { name: 'Agentic Engine', href: '/engine', icon: Cpu, exact: true },
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
      <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-surface-400 uppercase">
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
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-brand-600" />
            )}
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto font-mono text-[11px] px-1.5 py-0.2 rounded bg-surface-200 text-surface-600 group-hover:bg-surface-300 transition-colors">
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
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendVersion, setBackendVersion] = useState<string>('0.2.0');

  useEffect(() => {
    let mounted = true;
    api.checkHealth()
      .then((res) => {
        if (!mounted) return;
        if (res && res.status === 'healthy') {
          setBackendStatus('connected');
          if (res.version) setBackendVersion(res.version);
        } else {
          setBackendStatus('disconnected');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('disconnected');
      });

    return () => {
      mounted = false;
    };
  }, []);

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
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-900 text-white shadow-xs group-hover:bg-brand-600 transition-colors">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-surface-900 leading-tight">
                ClaimScope
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-surface-400 uppercase">
                Investigation AI
              </span>
            </div>
          </Link>

          <Link
            href="/"
            title="Public Homepage"
            className="p-1 rounded text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
          <Suspense fallback={<div className="h-40 animate-pulse bg-surface-100 rounded-md" />}>
            <NavGroup label="Workspace" items={workspaceItems} onClose={onClose} />
            <div className="border-t border-surface-100 my-2" />
            <NavGroup label="Investigation" items={investigationItems} onClose={onClose} />
            <div className="border-t border-surface-100 my-2" />
            <NavGroup label="Platform" items={platformItems} onClose={onClose} />
          </Suspense>
        </nav>

        {/* Real System Telemetry Footer */}
        <div className="shrink-0 border-t border-surface-200 p-4 bg-surface-50/70">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  backendStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-500'
                )}
              />
              <span className="text-xs font-medium text-surface-700">
                {backendStatus === 'connected'
                  ? 'API Connected (8000)'
                  : backendStatus === 'checking'
                  ? 'Checking API...'
                  : 'Backend Disconnected'}
              </span>
            </div>
            <span className="font-mono text-[10px] bg-surface-200/80 px-1.5 py-0.5 rounded text-surface-700 font-medium">
              v{backendVersion}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-surface-400 font-mono pt-1 border-t border-surface-200/60">
            <span>LangGraph 0.2</span>
            <span>Gemini 2.5</span>
          </div>
        </div>
      </aside>
    </>
  );
};
