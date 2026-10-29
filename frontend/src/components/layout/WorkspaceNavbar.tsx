'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  PlusCircle,
  FolderOpen,
  Sparkles,
  Menu,
  X,
  FileCheck2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserProfileMenu } from '@/components/layout/UserProfileMenu';
import { cn } from '@/lib/utils';

export function WorkspaceNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isNewClaimActive = pathname === '/cases/new';
  const isClaimsActive = pathname === '/cases' || (pathname.startsWith('/cases/') && !isNewClaimActive);
  const isDemoActive = pathname === '/demo';

  const navLinks = [
    { label: 'New Claim', href: '/cases/new', icon: PlusCircle, active: isNewClaimActive },
    { label: 'Claims History', href: '/cases', icon: FolderOpen, active: isClaimsActive },
    { label: 'Sample Claims', href: '/demo', icon: Sparkles, active: isDemoActive },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-surface-200/80 bg-surface-0/95 dark:bg-[#0c1322]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Primary Nav */}
        <div className="flex items-center gap-6 sm:gap-8 shrink-0">
          <Link href="/cases" className="flex items-center gap-2.5 group" title="ClaimScope Claims">
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
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 tracking-wide">
                Auto Claims
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-surface-200 dark:bg-surface-700 hidden sm:block" />

          {/* Clean Business Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white font-semibold'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Theme, User Menu, and Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle className="h-8 w-8 p-1.5 rounded-lg" />
          <UserProfileMenu />

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => router.push('/cases/new')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Claim</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-[#0c1322] px-4 py-3 shadow-md space-y-2">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                    item.active
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/cases/new');
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Start New Claim</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
