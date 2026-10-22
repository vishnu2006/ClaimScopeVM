'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  X,
  Server,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Shield,
  Activity,
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
  { name: 'Executive Cockpit', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Claims Registry', href: '/cases', icon: FolderOpen, exact: false },
  { name: 'New Claim Intake', href: '/cases/new', icon: PlusCircle, exact: true },
];

const investigationItems: NavItem[] = [
  { name: 'Document Vault', href: '/documents', icon: FileText, exact: true },
  { name: 'Discrepancy Review', href: '/discrepancies', icon: GitCompare, exact: true },
  { name: 'Investigation Reports', href: '/reports', icon: FileCheck2, exact: true },
];

const platformItems: NavItem[] = [
  { name: 'Agentic Engine', href: '/engine', icon: Cpu, exact: true },
  { name: 'Demo Scenarios', href: '/demo', icon: FlaskConical, exact: true, badge: '5 Tests' },
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
      <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-surface-400 uppercase">
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
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-50/80 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold shadow-2xs'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-brand-500" />
            )}
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-brand-500' : 'text-surface-400 group-hover:text-surface-600'
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-surface-200 dark:bg-surface-200/60 text-surface-600 dark:text-surface-300 font-semibold">
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
  const [backendVersion, setBackendVersion] = useState<string>('0.2.0');
  const [geminiStatus, setGeminiStatus] = useState<'Checking' | 'Available' | 'Not configured' | 'Unavailable'>('Checking');
  const [geminiDetails, setGeminiDetails] = useState<{ model?: string; maskedKey?: string | null; message?: string }>({});
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check backend health
    api.checkHealth()
      .then((res: { status: string; version?: string; app?: string } | null) => {
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
          onClick={onClose}
          className="fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-sidebar flex flex-col border-r border-surface-200 bg-surface-0 dark:bg-[#0c1322] transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-4.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-logo-container shadow-2xs group-hover:scale-105 transition-transform p-1">
              <Image
                src="/brand/vmlogo.png"
                alt="ValueMomentum ClaimScope"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-[#0a1f44] dark:text-white leading-tight">
                  ClaimScope
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-growth-50 dark:bg-growth-900/40 text-growth-700 dark:text-growth-300 border border-growth-200 dark:border-growth-800">
                  P&amp;C
                </span>
              </div>
              <span className="text-[9px] font-semibold tracking-wider text-surface-400 uppercase">
                Adjudication AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle className="h-7 w-7 p-1 rounded-md" />
            <Link
              href="/"
              title="Public Corporate Overview"
              className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
          <Suspense fallback={<div className="h-40 animate-pulse bg-surface-100 rounded-md" />}>
            <NavGroup label="Operations" items={workspaceItems} onClose={onClose} />
            <div className="border-t border-surface-100 dark:border-surface-200/60 my-2" />
            <NavGroup label="Investigation" items={investigationItems} onClose={onClose} />
            <div className="border-t border-surface-100 dark:border-surface-200/60 my-2" />
            <NavGroup label="Architecture &amp; Tests" items={platformItems} onClose={onClose} />
          </Suspense>
        </nav>

        {/* Compact System & Telemetry Drawer */}
        <div className="shrink-0 border-t border-surface-200 p-3.5 bg-surface-50/70 dark:bg-surface-100/30 space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-surface-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Activity className="h-3 w-3 text-brand-500" />
              Engine Health
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-[10px] text-surface-400 hover:text-surface-700 transition-colors flex items-center gap-0.5 cursor-pointer font-medium"
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
                      ? 'bg-growth-500'
                      : backendStatus === 'Checking'
                      ? 'bg-amber-400 animate-spin'
                      : 'bg-rose-500'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    backendStatus === 'Available'
                      ? 'text-growth-700 dark:text-growth-400'
                      : backendStatus === 'Checking'
                      ? 'text-surface-500'
                      : 'text-rose-700 dark:text-rose-400'
                  )}
                >
                  {backendStatus}
                </span>
              </div>
            </div>

            {/* Gemini AI Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-surface-700">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-[11px] font-medium">Gemini 3.5 Lite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    geminiStatus === 'Available'
                      ? 'bg-growth-500'
                      : geminiStatus === 'Not configured'
                      ? 'bg-amber-400'
                      : geminiStatus === 'Checking'
                      ? 'bg-surface-400 animate-spin'
                      : 'bg-rose-500'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    geminiStatus === 'Available'
                      ? 'text-growth-700 dark:text-growth-400'
                      : geminiStatus === 'Not configured'
                      ? 'text-amber-800 dark:text-amber-300'
                      : geminiStatus === 'Checking'
                      ? 'text-surface-500'
                      : 'text-rose-700 dark:text-rose-400'
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
                <span>FastAPI Release</span>
                <span className="text-surface-800 font-semibold">v{backendVersion}</span>
              </div>
              {geminiDetails.model && (
                <div className="flex items-center justify-between">
                  <span>Vision Model</span>
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">{geminiDetails.model}</span>
                </div>
              )}
              {geminiDetails.maskedKey && (
                <div className="flex items-center justify-between">
                  <span>Auth Key</span>
                  <span className="text-surface-800">{geminiDetails.maskedKey}</span>
                </div>
              )}
              <div className="pt-1">
                <Link
                  href="/engine"
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-sans text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <span>Architecture &amp; State Telemetry</span>
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
