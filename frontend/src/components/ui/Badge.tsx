import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default' | 'brand' | 'neutral' | 'growth' | 'pillar';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  mono?: boolean;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  mono = false,
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-100 text-surface-700 border-surface-200',
    neutral: 'bg-surface-100 dark:bg-surface-200/50 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-300',
    brand: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    growth: 'bg-growth-50 dark:bg-growth-900/30 text-growth-700 dark:text-growth-300 border-growth-200 dark:border-growth-800',
    pillar: 'bg-white dark:bg-surface-100 text-[#0a1f44] dark:text-white border border-surface-200 dark:border-surface-300 shadow-2xs font-semibold',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    error: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    pending: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  };

  const dotColors = {
    default: 'bg-surface-400',
    neutral: 'bg-surface-400',
    brand: 'bg-brand-500',
    growth: 'bg-growth-500',
    pillar: 'bg-brand-500',
    info: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    error: 'bg-rose-600',
    pending: 'bg-indigo-600',
  };

  const sizes = {
    xs: 'text-2xs px-2 py-0.5 leading-tight',
    sm: 'text-xs px-2.5 py-0.5 leading-normal',
    md: 'text-sm px-3 py-1 leading-normal font-medium',
    lg: 'text-base px-3.5 py-1.5 leading-normal font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium select-none tracking-tight',
        variants[variant],
        sizes[size],
        mono && 'font-mono tracking-tight',
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
