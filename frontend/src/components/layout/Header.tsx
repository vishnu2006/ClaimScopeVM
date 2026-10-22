'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onMenuToggle?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <header
      className={cn(
        'border-b border-surface-200/80 bg-surface-0 dark:bg-[#0e1726] px-4 sm:px-6 lg:px-8 py-4 shadow-subtle',
        className
      )}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="flex items-center gap-1.5 text-[11px] text-surface-500 mb-0.5"
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-surface-400 shrink-0" />}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn(isLast && 'font-semibold text-surface-800 dark:text-surface-200')}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a1f44] dark:text-white">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-surface-500 max-w-3xl">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start md:self-auto pt-2 md:pt-0 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
