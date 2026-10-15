import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'card-skeleton';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  variant = 'spinner',
  count = 3,
  className,
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3 w-full animate-pulse', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-surface-200/80 rounded-md w-full"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card-skeleton') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 border border-surface-200 rounded-lg bg-surface-0 shadow-card animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-surface-200 rounded w-24" />
              <div className="h-5 bg-surface-200 rounded-full w-16" />
            </div>
            <div className="h-5 bg-surface-200 rounded w-3/4" />
            <div className="space-y-1.5 pt-2">
              <div className="h-3 bg-surface-200 rounded w-1/2" />
              <div className="h-3 bg-surface-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center text-surface-500 w-full',
        className
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-brand-600 mb-3" />
      <p className="text-xs font-medium text-surface-600">{message}</p>
    </div>
  );
};
