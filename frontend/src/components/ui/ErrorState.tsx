import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-10 text-center rounded-lg border border-rose-200 bg-rose-50/40 text-surface-800',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-status-error mb-3 shadow-subtle">
        <AlertTriangle className="h-5 w-5 stroke-[2]" />
      </div>
      <h3 className="text-sm font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-xs text-surface-600 max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCw className="h-3.5 w-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
