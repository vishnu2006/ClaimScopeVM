'use client';

import React from 'react';
import {
  CheckCircle2,
  MinusCircle,
  AlertCircle,
  Clock,
  Cpu,
  FileText,
  ShieldAlert,
  Wrench,
  Camera,
  GitCompare,
  FileCheck,
  Globe,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { AgentExecutionRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { ThoughtLine } from '@/components/ui/ThoughtLine';

interface InvestigationStepperProps {
  executions?: AgentExecutionRecord[];
  isInvestigating?: boolean;
}

const AGENT_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  intake_classifier: { label: 'Intake Classifier', icon: FileText },
  supervisor_router: { label: 'Supervisor Router', icon: Cpu },
  fnol_extractor: { label: 'FNOL Extraction', icon: FileText },
  police_extractor: { label: 'Police Extraction', icon: ShieldAlert },
  estimate_extractor: { label: 'Estimate Parser', icon: Wrench },
  vision_agent: { label: 'Vision Damage Analysis', icon: Camera },
  consistency_agent: { label: 'Cross-Doc Reasoning', icon: GitCompare },
  external_verifier: { label: 'External Verifier', icon: Globe },
  assessment_engine: { label: 'Rules & Assessment', icon: ShieldCheck },
  synthesis_agent: { label: 'Report Synthesizer', icon: FileCheck },
};

export function InvestigationStepper({
  executions = [],
  isInvestigating = false,
}: InvestigationStepperProps) {
  if (executions.length === 0 && !isInvestigating) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50/70 p-3.5 text-xs text-surface-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-surface-400" />
          <span>Adaptive LangGraph pipeline ready. Ingest package files and trigger investigation to orchestrate agents.</span>
        </div>
        <span className="text-[10px] font-mono text-surface-400 uppercase tracking-wider">
          Standby
        </span>
      </div>
    );
  }

  // Count execution outcomes
  const completedCount = executions.filter((e) => e.status === 'completed').length;
  const skippedCount = executions.filter((e) => e.status === 'skipped').length;
  const failedCount = executions.filter((e) => e.status === 'failed').length;

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 shadow-card space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-surface-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-brand-50 text-brand-600">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900 leading-tight">
              Adaptive LangGraph Execution Pipeline
            </h4>
            <p className="text-[11px] text-surface-500">
              Conditional agent routing with provenance tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInvestigating ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-brand-600 animate-ping" />
              <span>Orchestrating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-surface-500">
              <span className="text-emerald-700 font-semibold">{completedCount} Completed</span>
              <span>•</span>
              <span className="text-surface-500">{skippedCount} Skipped</span>
              {failedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-700 font-semibold">{failedCount} Failed</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time ThoughtLine Trace while investigating */}
      {isInvestigating && (
        <div className="p-3 bg-brand-50/70 dark:bg-brand-950/40 rounded-lg border border-brand-200/80 dark:border-brand-800">
          <ThoughtLine
            working={isInvestigating}
            steps={
              executions.length > 0
                ? executions.map((e) => `${e.display_name || e.agent_id}: ${e.status}`)
                : [
                    'Intake Classifier evaluating document types',
                    'Supervisor determining required investigation nodes',
                    'Dispatching specialist agents',
                  ]
            }
            label="Agentic Investigation Pipeline executing…"
            doneLabel="Pipeline finished in"
            fontSize={13}
            showTimer
            color="var(--color-brand-600, #2563eb)"
          />
        </div>
      )}

      {/* Grid of Agent Execution Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {executions.map((record) => {
          const meta = AGENT_META[record.agent_id] || {
            label: record.display_name || record.agent_id,
            icon: Cpu,
          };
          const Icon = meta.icon;

          const isCompleted = record.status === 'completed';
          const isSkipped = record.status === 'skipped';
          const isFailed = record.status === 'failed';
          const isPending = record.status === 'pending';

          return (
            <div
              key={record.agent_id}
              className={`rounded border p-2.5 flex flex-col justify-between transition-all ${
                isCompleted
                  ? 'border-surface-200 bg-surface-50/50 hover:border-surface-300'
                  : isSkipped
                  ? 'border-surface-200 bg-surface-100/40 opacity-75'
                  : isFailed
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-brand-200 bg-brand-50/20'
              }`}
            >
              <div className="space-y-1">
                {/* Agent Title & Status Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`p-1 rounded shrink-0 ${
                        isCompleted
                          ? 'text-emerald-600 bg-emerald-50'
                          : isSkipped
                          ? 'text-surface-400 bg-surface-100'
                          : isFailed
                          ? 'text-status-error bg-rose-50'
                          : 'text-brand-600 bg-brand-50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-surface-800 truncate">
                      {record.display_name || meta.label}
                    </span>
                  </div>

                  {isCompleted && (
                    <Badge variant="success" size="xs" dot>
                      Done
                    </Badge>
                  )}
                  {isSkipped && (
                    <Badge variant="neutral" size="xs">
                      Skipped
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="error" size="xs" dot>
                      Failed
                    </Badge>
                  )}
                  {isPending && (
                    <Badge variant="pending" size="xs">
                      Running
                    </Badge>
                  )}
                </div>

                {/* Skip Reason or Notes */}
                {record.skip_reason && (
                  <p className="text-[10px] text-surface-500 italic pl-7 leading-tight">
                    {record.skip_reason}
                  </p>
                )}

                {record.error_message && (
                  <p className="text-[10px] text-status-error font-mono pl-7 leading-tight">
                    {record.error_message}
                  </p>
                )}

                {/* Structured Execution Details */}
                {record.details && Object.keys(record.details).length > 0 && (
                  <div className="text-[10px] font-mono text-surface-600 pl-7 flex flex-wrap gap-1 pt-0.5">
                    {Object.entries(record.details).map(([k, v]) => (
                      <span
                        key={k}
                        className="bg-surface-100 rounded px-1.5 py-0.2 border border-surface-200/80"
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
