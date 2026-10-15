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
} from 'lucide-react';
import { AgentExecutionRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface InvestigationStepperProps {
  executions?: AgentExecutionRecord[];
  isInvestigating?: boolean;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  intake_classifier: <FileText className="h-4 w-4" />,
  supervisor_router: <Cpu className="h-4 w-4" />,
  fnol_extractor: <FileText className="h-4 w-4" />,
  police_extractor: <ShieldAlert className="h-4 w-4" />,
  estimate_extractor: <Wrench className="h-4 w-4" />,
  vision_agent: <Camera className="h-4 w-4" />,
  consistency_agent: <GitCompare className="h-4 w-4" />,
  external_verifier: <Globe className="h-4 w-4" />,
  assessment_engine: <ShieldCheck className="h-4 w-4" />,
  synthesis_agent: <FileCheck className="h-4 w-4" />,
};

export function InvestigationStepper({ executions = [], isInvestigating = false }: InvestigationStepperProps) {
  if (executions.length === 0 && !isInvestigating) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 text-xs text-surface-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-surface-400" />
          <span>Adaptive LangGraph investigation has not yet run on this incident package.</span>
        </div>
        <span className="text-[11px] font-mono text-surface-400">Ready to orchestrate</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 sm:p-5 shadow-subtle space-y-4">
      <div className="flex items-center justify-between border-b border-surface-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-brand-50 text-brand-700">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900">
              Adaptive Agent Orchestration
            </h4>
            <p className="text-[11px] text-surface-500">
              LangGraph conditional execution based on package contents
            </p>
          </div>
        </div>

        {isInvestigating && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-600 animate-ping" />
            <span className="text-xs font-medium text-brand-700">Investigating...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {executions.map((record) => {
          const icon = AGENT_ICONS[record.agent_id] || <Cpu className="h-4 w-4" />;

          return (
            <div
              key={record.agent_id}
              className={`rounded-md border p-3 flex flex-col justify-between transition-all ${
                record.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : record.status === 'skipped'
                  ? 'border-surface-200 bg-surface-50/60 opacity-80'
                  : record.status === 'failed'
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-surface-200 bg-surface-0'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-surface-800 font-semibold text-xs">
                    <span className="text-surface-500 shrink-0">{icon}</span>
                    <span className="truncate">{record.display_name}</span>
                  </div>

                  {record.status === 'completed' && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {record.status === 'skipped' && (
                    <Badge variant="default" size="sm">
                      <MinusCircle className="h-3 w-3 mr-1 text-surface-400" />
                      Skipped
                    </Badge>
                  )}
                  {record.status === 'failed' && (
                    <Badge variant="error" size="sm">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {record.status === 'pending' && (
                    <Badge variant="pending" size="sm">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>

                {record.skip_reason && (
                  <p className="text-[11px] text-surface-500 italic pl-6">
                    {record.skip_reason}
                  </p>
                )}

                {record.error_message && (
                  <p className="text-[11px] text-status-error font-mono pl-6">
                    {record.error_message}
                  </p>
                )}

                {record.details && Object.keys(record.details).length > 0 && (
                  <div className="text-[10px] font-mono text-surface-600 pl-6 flex flex-wrap gap-2 pt-1">
                    {Object.entries(record.details).map(([k, v]) => (
                      <span key={k} className="bg-surface-100 rounded px-1.5 py-0.5 border border-surface-200">
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
