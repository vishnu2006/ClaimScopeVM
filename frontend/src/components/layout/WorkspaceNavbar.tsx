'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  PlusCircle,
  FolderOpen,
  FileText,
  GitCompare,
  Search,
  FileCheck2,
  Cpu,
  FlaskConical,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserProfileMenu } from '@/components/layout/UserProfileMenu';
import { Button } from '@/components/ui/Button';
import { StarBorder } from '@/components/ui/StarBorder';
import { GooeyNav, GooeyNavItem } from '@/components/ui/GooeyNav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function WorkspaceNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'down'>('checking');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.5-flash-lite');

  const investigationRef = useRef<HTMLDivElement>(null);
  const platformRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (investigationRef.current && !investigationRef.current.contains(target)) {
        setInvestigationOpen(false);
      }
      if (platformRef.current && !platformRef.current.contains(target)) {
        setPlatformOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setInvestigationOpen(false);
    setPlatformOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Telemetry checks
  useEffect(() => {
    let mounted = true;

    api.checkHealth()
      .then((res) => {
        if (!mounted) return;
        if (res && res.status === 'healthy') {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('down');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('down');
      });

    api.checkDiagnostics()
      .then((res) => {
        if (!mounted) return;
        if (res && res.configured_model) {
          setGeminiModel(res.configured_model);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const isOverviewActive = pathname === '/dashboard';
  const isClaimsActive = pathname === '/cases' || pathname.startsWith('/cases/');
  const isInvestigationActive =
    pathname.startsWith('/documents') ||
    pathname.startsWith('/discrepancies') ||
    pathname.startsWith('/evidence');
  const isReportsActive = pathname.startsWith('/reports');
  const isPlatformActive = pathname.startsWith('/engine');
  const isDemoActive = pathname.startsWith('/demo');

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-surface-200/80 bg-surface-0/95 dark:bg-[#0c1322]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Primary Nav */}
        <div className="flex items-center gap-5 sm:gap-7 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" title="Return to Public Site">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-logo-container p-1 group-hover:scale-105 transition-transform">
              <Image
                src="/brand/vmlogo.png"
                alt="ClaimScope"
                width={26}
                height={26}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[#0a1f44] dark:text-white leading-none">
                ClaimScope
              </span>
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">
                P&amp;C
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-surface-200 dark:bg-surface-200/40 hidden sm:block" />

          {/* Interactive Gooey Nav for Workspace Top Bar */}
          <div className="hidden lg:flex items-center">
            <GooeyNav
              items={[
                { label: 'Overview', href: '/dashboard' },
                { label: 'Claims', href: '/cases' },
                { label: 'Investigation', href: '/documents' },
                { label: 'Reports', href: '/reports' },
                { label: 'Platform', href: '/engine' },
                { label: 'Demo Lab', href: '/demo' },
              ]}
              activeIndex={
                isOverviewActive
                  ? 0
                  : isClaimsActive
                  ? 1
                  : isInvestigationActive
                  ? 2
                  : isReportsActive
                  ? 3
                  : isPlatformActive
                  ? 4
                  : isDemoActive
                  ? 5
                  : 0
              }
              size="sm"
              frame={false}
              color="#086afc"
              activeTextColor="#ffffff"
              spread={45}
              animationTime={450}
              gooeyness={0.4}
              wobble={0.4}
              hoverEffect={true}
            />
          </div>
        </div>

        {/* Right: Theme & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle className="h-8 w-8 p-1.5 rounded-lg" />
          <UserProfileMenu />

          {/* Primary Action Button with StarBorder */}
          <StarBorder
            as="button"
            onClick={() => router.push('/cases/new')}
            color="#086afc"
            trailColor="#5eba46"
            duration={3.5}
            thickness={2}
            radius={8}
            glow={0.7}
            hover="lap"
            backgroundColor="#086afc"
            textColor="#ffffff"
            borderColor="rgba(8, 106, 252, 0.4)"
            className="hidden sm:inline-flex !py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            <span>New Claim</span>
          </StarBorder>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors cursor-pointer"
            aria-label="Toggle workspace navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-200 bg-surface-0 dark:bg-[#0c1322] px-4 sm:px-6 py-3 shadow-card space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              className={cn(
                'block px-3 py-1.5 rounded-md text-xs font-semibold',
                isOverviewActive ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-100'
              )}
            >
              Overview
            </Link>
            <Link
              href="/cases"
              className={cn(
                'block px-3 py-1.5 rounded-md text-xs font-semibold',
                isClaimsActive ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-100'
              )}
            >
              Claims Registry
            </Link>
            <Link
              href="/documents"
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-surface-700 hover:bg-surface-100"
            >
              Document Vault
            </Link>
            <Link
              href="/discrepancies"
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-surface-700 hover:bg-surface-100"
            >
              Discrepancy Review
            </Link>
            <Link
              href="/evidence"
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-surface-700 hover:bg-surface-100"
            >
              Evidence Analysis
            </Link>
            <Link
              href="/reports"
              className={cn(
                'block px-3 py-1.5 rounded-md text-xs font-semibold',
                isReportsActive ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-100'
              )}
            >
              Investigation Reports
            </Link>
            <Link
              href="/engine"
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-surface-700 hover:bg-surface-100"
            >
              Agentic Engine
            </Link>
            <Link
              href="/demo"
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-surface-700 hover:bg-surface-100"
            >
              Demo Lab
            </Link>
          </div>

          <div className="pt-2 border-t border-surface-100 flex flex-col gap-1.5">
            <Link href="/cases/new" className="w-full">
              <Button variant="vm-primary" size="sm" className="w-full justify-center">
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                <span>New Claim Intake</span>
              </Button>
            </Link>
            <Link href="/" className="text-center text-xs text-surface-500 hover:text-surface-900 py-1">
              Public Homepage
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
