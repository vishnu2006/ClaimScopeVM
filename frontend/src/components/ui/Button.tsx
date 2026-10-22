'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'growth' | 'vm-primary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'cursor-target inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50 disabled:pointer-events-none select-none rounded-lg cursor-pointer tracking-tight';

    const variants = {
      primary:
        'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm border border-brand-600 font-semibold',
      'vm-primary':
        'bg-[#086afc] text-white hover:bg-[#0056d6] active:bg-[#0045ad] shadow-sm border border-[#0056d6] font-semibold',
      growth:
        'bg-growth-500 text-white hover:bg-growth-600 active:bg-growth-700 shadow-sm border border-growth-600 font-semibold',
      secondary:
        'bg-surface-0 text-surface-800 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200 border border-surface-300 shadow-2xs',
      outline:
        'bg-transparent text-surface-700 hover:bg-surface-100 hover:text-surface-900 border border-surface-200',
      ghost:
        'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200',
      danger:
        'bg-status-error text-white hover:bg-red-700 active:bg-red-800 shadow-2xs border border-red-700 font-medium',
    };

    const sizes = {
      xs: 'text-xs px-2.5 py-1 gap-1.5 h-7.5 rounded-md',
      sm: 'text-xs px-3.5 py-1.5 gap-2 h-8.5 rounded-md font-medium',
      md: 'text-sm px-4 py-2 gap-2 h-9.5 rounded-lg',
      lg: 'text-base px-6 py-2.5 gap-2.5 h-11 rounded-lg font-semibold',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
