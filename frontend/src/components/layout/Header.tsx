'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Menu } from 'lucide-react';
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
  onMenuToggle,
  className,
}) => {
  return (
    <header
      className={cn(
        'border-b border-surface-200 bg-surface-0 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-subtle',
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="mt-1 rounded-md p-1.5 text-surface-500 hover:bg-surface-100 lg:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                className="flex items-center gap-1.5 text-xs text-surface-500 mb-1"
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
                          className="hover:text-surface-900 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={cn(isLast && 'font-medium text-surface-800')}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start md:self-auto pt-2 md:pt-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
