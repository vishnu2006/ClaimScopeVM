'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSearch,
  ScanEye,
  GitCompare,
  Globe2,
  FileCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export interface InvestigationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  weight: number; // percentage weighting
}

const DEFAULT_STEPS: InvestigationStep[] = [
  {
    id: 'intake',
    title: 'Intake & Document OCR',
    description: 'Classifying documents, reading text from FNOL forms, police dockets, and appraisal worksheets...',
    icon: FileSearch,
    weight: 20,
  },
  {
    id: 'vision',
    title: 'Visual Damage Inspection',
    description: 'Analyzing vehicle damage photographs, bumper crumple zones, fracture patterns, and severity grading...',
    icon: ScanEye,
    weight: 25,
  },
  {
    id: 'reconciliation',
    title: 'Cross-Evidence Reconciliation',
    description: 'Checking consistency of accident date, loss location, impact velocity, and driver statements...',
    icon: GitCompare,
    weight: 25,
  },
  {
    id: 'registry',
    title: 'External Registry & Benchmarking',
    description: 'Checking geospatial environment, historical weather reports, and regional labor rates...',
    icon: Globe2,
    weight: 15,
  },
  {
    id: 'synthesis',
    title: 'Synthesizing Adjuster Findings',
    description: 'Assembling discrepancy list, evidence provenance mappings, and adjuster action recommendations...',
    icon: FileCheck,
    weight: 15,
  },
];

export interface DetailedInvestigationLoaderProps {
  isDone: boolean;
  onShowReport?: () => void;
  title?: string;
  subtitle?: string;
  caseNumber?: string;
}

export const DetailedInvestigationLoader: React.FC<DetailedInvestigationLoaderProps> = ({
  isDone,
  onShowReport,
  title = 'Investigating Claim Package',
  subtitle = 'Evaluating submitted documents, photographs, and timelines against auto collision standards...',
  caseNumber,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate steps if not yet done
  useEffect(() => {
    if (isDone) {
      setCurrentStepIdx(DEFAULT_STEPS.length);
      setProgressPercent(100);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < DEFAULT_STEPS.length - 1) {
          const next = prev + 1;
          const cumPercent = DEFAULT_STEPS.slice(0, next + 1).reduce((acc, s) => acc + s.weight, 0);
          setProgressPercent(Math.min(94, cumPercent));
          return next;
        }
        return prev;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isDone]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Header & Live Status */}
      <div className="p-6 sm:p-8 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
              {isDone ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Investigation Ready</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-600" />
                  <span>Live Analysis In Progress</span>
                </>
              )}
              {caseNumber && <span className="opacity-75">• Claim #{caseNumber}</span>}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white pt-1">
              {isDone ? 'Investigation Complete' : title}
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 max-w-md">
              {isDone
                ? 'All evidence has been cross-referenced. Your structured investigation dossier is prepared.'
                : subtitle}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
              {isDone ? 100 : progressPercent}%
            </div>
            <div className="text-[11px] text-surface-400 font-medium">
              Elapsed: {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 relative w-full h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isDone
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-500 dark:to-indigo-400'
            }`}
            style={{ width: `${isDone ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step List Progression */}
      <div className="p-6 sm:p-8 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Investigation Milestones
        </div>

        <div className="space-y-3">
          {DEFAULT_STEPS.map((step, idx) => {
            const isCompleted = isDone || currentStepIdx > idx;
            const isCurrent = !isDone && currentStepIdx === idx;
            const isUpcoming = !isDone && currentStepIdx < idx;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 shadow-xs'
                    : isCompleted
                    ? 'bg-surface-50/60 dark:bg-surface-800/40'
                    : 'opacity-50'
                }`}
              >
                <div
                  className={`mt-0.5 p-2 rounded-lg shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-xs animate-pulse'
                      : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent
                          ? 'text-brand-900 dark:text-brand-200 font-bold'
                          : isCompleted
                          ? 'text-surface-800 dark:text-surface-200'
                          : 'text-surface-500'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={`text-[10px] font-medium shrink-0 ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-surface-400'
                      }`}
                    >
                      {isCompleted ? 'Completed' : isCurrent ? 'Working...' : 'Queued'}
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-500 mt-0.5 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Action Banner */}
      {isDone && onShowReport && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">
                Findings & Analysis Ready
              </div>
              <div className="text-xs text-surface-500">
                View cross-referenced evidence, damage photos, and adjuster checklist.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onShowReport}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <span>Show Investigation Report</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

