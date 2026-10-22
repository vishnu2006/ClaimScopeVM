'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Camera,
  GitCompare,
  Globe,
  Cpu,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface StageNode {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  type: 'core' | 'conditional' | 'synthesis';
  conditionNote?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const PARALLEL_EXTRACTORS: StageNode[] = [
  {
    id: 'fnol',
    number: '3a',
    title: 'FNOL Extraction Agent',
    subtitle: 'Policy, parties, incident location & narrative facts',
    type: 'conditional',
    conditionNote: 'Executes when First Notice of Loss form is present',
    icon: FileText,
    accentColor: 'text-[#086afc] border-[#086afc]/20 bg-brand-50/50 dark:bg-brand-950/30',
  },
  {
    id: 'police',
    number: '3b',
    title: 'Police Report Agent',
    subtitle: 'Officer narrative, citations, timestamp & weather record',
    type: 'conditional',
    conditionNote: 'Conditional: Skips gracefully if police report is not filed',
    icon: ShieldAlert,
    accentColor: 'text-amber-500 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30',
  },
  {
    id: 'estimate',
    number: '3c',
    title: 'Repair Estimate Agent',
    subtitle: 'Itemized parts, body labor hours & total repair cost',
    type: 'conditional',
    conditionNote: 'Conditional: Skips if no certified estimate is in package',
    icon: FileText,
    accentColor: 'text-[#5eba46] border-[#5eba46]/20 bg-growth-50/50 dark:bg-growth-900/20',
  },
  {
    id: 'vision',
    number: '3d',
    title: 'Vehicle Damage Vision',
    subtitle: 'Point of impact, structural intrusion & severity rubric',
    type: 'conditional',
    conditionNote: 'Conditional: Skips if zero damage photographs uploaded',
    icon: Camera,
    accentColor: 'text-purple-500 border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30',
  },
];

export const SystemArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="py-10 sm:py-14 border-t border-b border-surface-200/80 bg-surface-50/60 relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Section Header with Calibrated Typography */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-0 border border-surface-200 text-[#086afc] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
            <Cpu className="h-3 w-3" />
            <span>Deterministic LangGraph Orchestration</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0a1f44] dark:text-white">
            Intelligence that follows the evidence.
          </h2>
          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed max-w-xl mx-auto">
            A conditional multi-agent investigation architecture that activates the right capabilities for every incident package.
          </p>
        </div>

        {/* The Architectural Visualization Canvas */}
        <div className="max-w-3xl mx-auto bg-surface-0 dark:bg-[#121c2e] border border-surface-200 rounded-xl p-4.5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 dark:border-surface-200 pb-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#0a1f44] dark:text-white text-xs">
              <Layers className="h-3.5 w-3.5 text-[#086afc]" />
              <span>LangGraph StateGraph(CaseState) Lifecycle</span>
            </div>
            <div className="flex items-center gap-3 text-surface-500 text-[10.5px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#086afc]" />
                <span>Deterministic Node</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5eba46]" />
                <span>Conditional Extractors</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Step 1: Intake & Supervisor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-surface-200 bg-surface-50 dark:bg-surface-100/40 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-surface-400">
                  <span>STAGE 1</span>
                  <Badge variant="brand" size="xs">Intake</Badge>
                </div>
                <h4 className="font-bold text-surface-900 text-xs">Incident Document Intake</h4>
                <p className="text-[10.5px] text-surface-500">Vector PDF extraction via PyMuPDF + Gemini vision OCR fallback.</p>
              </div>

              <div className="p-3 rounded-lg border border-surface-200 bg-surface-50 dark:bg-surface-100/40 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-surface-400">
                  <span>STAGE 2</span>
                  <Badge variant="growth" size="xs">Router</Badge>
                </div>
                <h4 className="font-bold text-surface-900 text-xs">Adaptive Supervisor</h4>
                <p className="text-[10.5px] text-surface-500">Inspects inventory and dynamically dispatches only applicable specialists.</p>
              </div>
            </div>

            {/* Step 2: 4 Parallel Extractors */}
            <div className="p-3 rounded-lg border border-surface-200 bg-surface-50/50 dark:bg-surface-100/20 space-y-2">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-surface-400 block">
                STAGE 3: Parallel Specialized Agents (Conditional Dispatch)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PARALLEL_EXTRACTORS.map((ext) => (
                  <div
                    key={ext.id}
                    className={cn(
                      'p-2.5 rounded-md border bg-surface-0 dark:bg-[#17243b] space-y-0.5 transition-all text-xs',
                      ext.accentColor
                    )}
                  >
                    <div className="flex items-center justify-between text-[9.5px] font-mono font-bold">
                      <span>{ext.number}</span>
                      <span className="text-[8.5px] uppercase px-1 rounded bg-surface-100 dark:bg-surface-200/50">Active</span>
                    </div>
                    <div className="font-bold text-[11px] text-surface-900 truncate">{ext.title}</div>
                    <p className="text-[9.5px] text-surface-500 line-clamp-2 leading-snug">{ext.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Consistency & External Grounding */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-surface-200 bg-surface-50 dark:bg-surface-100/40 space-y-1">
                <div className="text-[9.5px] font-bold text-surface-400">STAGE 4</div>
                <h4 className="font-bold text-surface-900 text-xs">Cross-Document Review</h4>
                <p className="text-[10.5px] text-surface-500 leading-snug">Compares facts across files to isolate story and identity conflicts.</p>
              </div>

              <div className="p-3 rounded-lg border border-surface-200 bg-surface-50 dark:bg-surface-100/40 space-y-1">
                <div className="text-[9.5px] font-bold text-surface-400">STAGE 5</div>
                <h4 className="font-bold text-surface-900 text-xs">External Grounding</h4>
                <p className="text-[10.5px] text-surface-500 leading-snug">NHTSA vPIC VIN verification and Open-Meteo weather history.</p>
              </div>

              <div className="p-3 rounded-lg border border-surface-200 bg-surface-50 dark:bg-surface-100/40 space-y-1">
                <div className="text-[9.5px] font-bold text-surface-400">STAGE 6 &amp; 7</div>
                <h4 className="font-bold text-surface-900 text-xs">Adjudication &amp; PDF</h4>
                <p className="text-[10.5px] text-surface-500 leading-snug">Deterministic triage rules and ReportLab multi-page export.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
