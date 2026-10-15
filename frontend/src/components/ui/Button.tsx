'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
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
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50 disabled:pointer-events-none select-none rounded-md cursor-pointer tracking-tight';

    const variants = {
      primary:
        'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs border border-brand-700 font-medium',
      secondary:
        'bg-surface-0 text-surface-800 hover:bg-surface-50 hover:text-surface-900 active:bg-surface-100 border border-surface-300 shadow-xs',
      outline:
        'bg-transparent text-surface-700 hover:bg-surface-100 hover:text-surface-900 border border-surface-200',
      ghost:
        'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200',
      danger:
        'bg-status-error text-white hover:bg-red-700 active:bg-red-800 shadow-xs border border-red-700 font-medium',
    };

    const sizes = {
      xs: 'text-xs px-2.5 py-1 gap-1.5 h-7.5 rounded',
      sm: 'text-xs px-3.5 py-1.5 gap-2 h-8.5 rounded-md',
      md: 'text-sm px-4 py-2 gap-2 h-9.5 rounded-md',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11 rounded-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
