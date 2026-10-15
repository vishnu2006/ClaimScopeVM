'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Server,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
  const [backendStatus, setBackendStatus] = useState<'Checking' | 'Available' | 'Unavailable'>('Checking');
  const [geminiStatus, setGeminiStatus] = useState<'Checking' | 'Available' | 'Not configured' | 'Unavailable'>('Checking');
  const [geminiDetails, setGeminiDetails] = useState<{ model?: string; maskedKey?: string | null; message?: string }>({});
  const [backendVersion, setBackendVersion] = useState<string>('0.2.0');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check backend health
    api.checkHealth()
      .then((res) => {
        if (!mounted) return;
        if (res && res.status === 'healthy') {
          setBackendStatus('Available');
          if (res.version) setBackendVersion(res.version);
        } else {
          setBackendStatus('Unavailable');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('Unavailable');
      });

    // Check Gemini AI diagnostics independently
    api.checkDiagnostics()
      .then((res) => {
        if (!mounted) return;
        if (!res) {
          setGeminiStatus('Unavailable');
          return;
        }

        if (res.connectivity_status === 'connected') {
          setGeminiStatus('Available');
        } else if (res.connectivity_status === 'unconfigured' || !res.api_key_configured) {
          setGeminiStatus('Not configured');
        } else {
          setGeminiStatus('Unavailable');
        }

        setGeminiDetails({
          model: res.configured_model,
          maskedKey: res.masked_key,
          message: res.message,
        });
      })
      .catch(() => {
        if (mounted) setGeminiStatus('Unavailable');
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
          'fixed inset-y-0 left-0 z-40 w-sidebar flex flex-col border-r border-surface-200 bg-surface-0 dark:bg-[#15171b] transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-900 text-white shadow-xs group-hover:bg-brand-600 transition-colors p-1">
              <Image
                src="/brand/claimscope-logo.png"
                alt="ClaimScope Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
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

          <div className="flex items-center gap-1.5">
            <ThemeToggle className="h-7 w-7 p-1 rounded-md" />
            <Link
              href="/"
              title="Public Homepage"
              className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
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

        {/* Compact, Dignified System Status */}
        <div className="shrink-0 border-t border-surface-200 p-3.5 bg-surface-50/70 space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-surface-500 uppercase tracking-wider text-[10px]">
              System Status
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-[11px] text-surface-400 hover:text-surface-700 transition-colors flex items-center gap-0.5 cursor-pointer"
              title="Toggle system details"
            >
              <span>{detailsOpen ? 'Hide' : 'Details'}</span>
              {detailsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Status Badges Row */}
          <div className="space-y-1.5 text-xs">
            {/* Backend Service Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-surface-700">
                <Server className="h-3.5 w-3.5 text-surface-400" />
                <span className="text-[11px] font-medium">Core API</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    backendStatus === 'Available'
                      ? 'bg-emerald-500'
                      : backendStatus === 'Checking'
                      ? 'bg-amber-400 animate-spin'
                      : 'bg-rose-500'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    backendStatus === 'Available'
                      ? 'text-emerald-700'
                      : backendStatus === 'Checking'
                      ? 'text-surface-500'
                      : 'text-rose-700'
                  )}
                >
                  {backendStatus}
                </span>
              </div>
            </div>

            {/* Gemini AI Status (Independent from backend health) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-surface-700">
                <Sparkles className="h-3.5 w-3.5 text-surface-400" />
                <span className="text-[11px] font-medium">Gemini AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    geminiStatus === 'Available'
                      ? 'bg-emerald-500'
                      : geminiStatus === 'Not configured'
                      ? 'bg-amber-400'
                      : geminiStatus === 'Checking'
                      ? 'bg-surface-400 animate-spin'
                      : 'bg-rose-500'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    geminiStatus === 'Available'
                      ? 'text-emerald-700'
                      : geminiStatus === 'Not configured'
                      ? 'text-amber-800'
                      : geminiStatus === 'Checking'
                      ? 'text-surface-500'
                      : 'text-rose-700'
                  )}
                >
                  {geminiStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Technical Details */}
          {detailsOpen && (
            <div className="pt-2 border-t border-surface-200/60 text-[10px] text-surface-500 space-y-1 font-mono animate-fade-in">
              <div className="flex items-center justify-between">
                <span>API Version</span>
                <span className="text-surface-800">v{backendVersion}</span>
              </div>
              {geminiDetails.model && (
                <div className="flex items-center justify-between">
                  <span>AI Model</span>
                  <span className="text-surface-800">{geminiDetails.model}</span>
                </div>
              )}
              {geminiDetails.maskedKey && (
                <div className="flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-surface-800">{geminiDetails.maskedKey}</span>
                </div>
              )}
              <div className="pt-1">
                <Link
                  href="/engine"
                  className="text-brand-600 hover:text-brand-800 font-sans text-[11px] font-medium inline-flex items-center gap-1"
                >
                  <span>System Architecture Overview</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
