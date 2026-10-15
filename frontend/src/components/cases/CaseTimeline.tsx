import React from 'react';
import { CheckCircle2, Clock, FileSearch, ShieldCheck, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document, Report } from '@/lib/types';

export interface CaseTimelineProps {
  documents: Document[];
  report?: Report | null;
  className?: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({
  documents,
  report,
  className,
}) => {
  const hasDocuments = documents.length > 0;
  const hasProcessedDocs = documents.some((d) => d.processing_status === 'completed');
  const hasReport = !!report;

  const steps = [
    {
      title: 'Incident Intake',
      desc: hasDocuments
        ? `${documents.length} document${documents.length === 1 ? '' : 's'} received`
        : 'Awaiting documents',
      icon: Clock,
      completed: hasDocuments,
      active: !hasDocuments,
    },
    {
      title: 'Document AI Extraction',
      desc: hasProcessedDocs
        ? 'Fields & photos extracted'
        : hasDocuments
        ? 'Ready to process'
        : 'Pending intake',
      icon: FileSearch,
      completed: hasProcessedDocs,
      active: hasDocuments && !hasProcessedDocs,
    },
    {
      title: 'Cross-Referencing & Verification',
      desc: hasReport
        ? `${report?.inconsistencies?.length || 0} inconsistencies checked`
        : hasProcessedDocs
        ? 'Ready for analysis'
        : 'Pending extraction',
      icon: Globe,
      completed: hasReport,
      active: hasProcessedDocs && !hasReport,
    },
    {
      title: 'Adjustor Assessment',
      desc: hasReport
        ? report?.recommendation === 'routine'
          ? 'Assessment: Routine'
          : 'Assessment: Flagged for Review'
        : 'Pending report generation',
      icon: ShieldCheck,
      completed: hasReport,
      active: false,
    },
  ];

  return (
    <div className={cn('bg-surface-0 border border-surface-200 rounded-lg p-5 shadow-card', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-4">
        Investigation Pipeline Progress
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className={cn(
                'relative flex items-start gap-3 rounded-md p-3 border transition-colors',
                step.completed
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : step.active
                  ? 'border-brand-200 bg-brand-50/40 ring-1 ring-brand-400'
                  : 'border-surface-200 bg-surface-50/50 opacity-70'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  step.completed
                    ? 'bg-emerald-600 text-white'
                    : step.active
                    ? 'bg-brand-600 text-white animate-pulse-subtle'
                    : 'bg-surface-200 text-surface-600'
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-surface-500" />
                  <span className="text-xs font-semibold text-surface-900 truncate">
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-1">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
