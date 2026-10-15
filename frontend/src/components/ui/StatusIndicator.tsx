import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessingStatus } from '@/lib/types';

export interface StatusIndicatorProps {
  status: ProcessingStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  errorMessage?: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = true,
  size = 'md',
  className,
  errorMessage,
}) => {
  const sizeClasses = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  };

  const config: Record<
    ProcessingStatus,
    { label: string; textClass: string; icon: React.ReactNode }
  > = {
    pending: {
      label: 'Pending',
      textClass: 'text-purple-700 bg-purple-50 border-purple-200',
      icon: <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse-subtle inline-block" />,
    },
    processing: {
      label: 'Processing',
      textClass: 'text-brand-700 bg-brand-50 border-brand-200',
      icon: <Loader2 className={cn(iconSizes[size], 'animate-spin text-brand-600 shrink-0')} />,
    },
    completed: {
      label: 'Completed',
      textClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 className={cn(iconSizes[size], 'text-emerald-600 shrink-0')} />,
    },
    failed: {
      label: 'Failed',
      textClass: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: <XCircle className={cn(iconSizes[size], 'text-rose-600 shrink-0')} />,
    },
    skipped: {
      label: 'Skipped',
      textClass: 'text-surface-600 bg-surface-100 border-surface-200',
      icon: <MinusCircle className={cn(iconSizes[size], 'text-surface-500 shrink-0')} />,
    },
    unavailable: {
      label: 'Unavailable',
      textClass: 'text-surface-500 bg-surface-100 border-surface-200',
      icon: <MinusCircle className={cn(iconSizes[size], 'text-surface-400 shrink-0')} />,
    },
  };

  const current = config[status] || config.pending;

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium leading-none select-none',
          current.textClass,
          sizeClasses[size]
        )}
      >
        {current.icon}
        {showLabel && <span>{current.label}</span>}
      </span>
      {errorMessage && (
        <span className="text-[11px] text-status-error mt-1 max-w-xs break-words">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
