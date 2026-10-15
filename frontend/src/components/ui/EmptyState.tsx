import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-lg border border-dashed border-surface-300 bg-surface-50/50',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-500 mb-3 shadow-subtle">
        <Icon className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-surface-900 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-surface-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
