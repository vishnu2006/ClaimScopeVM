import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default' | 'brand' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
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
    default: 'bg-surface-100 text-surface-700 border-surface-200/80',
    neutral: 'bg-surface-50 text-surface-600 border-surface-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200/70',
    info: 'bg-blue-50/80 text-blue-700 border-blue-200/70',
    success: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/70',
    warning: 'bg-amber-50/80 text-amber-800 border-amber-200/70',
    error: 'bg-rose-50/80 text-rose-800 border-rose-200/70',
    pending: 'bg-purple-50/80 text-purple-800 border-purple-200/70',
  };

  const dotColors = {
    default: 'bg-surface-400',
    neutral: 'bg-surface-400',
    brand: 'bg-brand-600',
    info: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-rose-600',
    pending: 'bg-purple-600',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.2 leading-tight',
    sm: 'text-[11px] px-2 py-0.5 leading-snug',
    md: 'text-xs px-2.5 py-1 leading-normal font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border transition-colors select-none whitespace-nowrap font-medium',
        variants[variant],
        sizes[size],
        mono && 'font-mono tracking-tight',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
