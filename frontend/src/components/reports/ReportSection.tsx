import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface ReportSectionProps {
  title: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  sources?: string[];
  confidence?: number;
  className?: string;
  children: React.ReactNode;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  badge,
  badgeVariant = 'default',
  sources,
  confidence,
  className,
  children,
}) => {
  return (
    <section className={cn('rounded-lg border border-surface-200 bg-surface-0 p-5 shadow-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-bold tracking-tight text-surface-900">{title}</h3>
          {badge && (
            <Badge variant={badgeVariant} size="sm">
              {badge}
            </Badge>
          )}
        </div>

        {typeof confidence === 'number' && (
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <span>Confidence:</span>
            <span className="font-semibold text-surface-800">
              {confidence <= 1 ? `${Math.round(confidence * 100)}%` : `${confidence}%`}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-surface-700 leading-relaxed space-y-3">{children}</div>

      {sources && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-surface-100 flex items-center gap-2 text-[11px] text-surface-400">
          <span className="font-semibold uppercase tracking-wider text-surface-500">
            Sources:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((src, i) => (
              <span
                key={i}
                className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded font-mono"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
