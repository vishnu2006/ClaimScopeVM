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
    accentColor: 'text-blue-500 border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30',
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
    accentColor: 'text-emerald-500 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30',
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
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <section id="architecture" className="py-14 md:py-18 border-t border-b border-surface-200/80 bg-surface-50/40 relative overflow-hidden">
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-10">
        {/* Section Header with Exact Required Title & Subtitle */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-0 border border-surface-200 text-brand-600 dark:text-brand-400 text-xs font-semibold shadow-2xs">
            <Cpu className="h-3.5 w-3.5" />
            <span>Deterministic LangGraph Orchestration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-surface-900">
            Intelligence that follows the evidence.
          </h2>
          <p className="text-sm sm:text-base text-surface-600 leading-relaxed max-w-2xl mx-auto">
            A conditional investigation architecture that activates the right capabilities for every incident package.
          </p>
        </div>

        {/* The Architectural Visualization Canvas */}
        <div className="max-w-4xl mx-auto bg-surface-0 border border-surface-200 rounded-2xl p-5 sm:p-8 shadow-card space-y-6">
          {/* Legend / Status Note */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-200 pb-5 text-xs text-surface-500">
            <div className="flex items-center gap-2 font-mono font-medium text-surface-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>StateGraph Pipeline Topology</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-600" />
                <span>Deterministic Node</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-dashed border-purple-500" />
                <span>Conditional Node</span>
              </span>
            </div>
          </div>

          {/* Node 1: Incident Intake */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('intake')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-md p-4 rounded-xl border border-surface-200 bg-surface-50/70 hover:border-brand-400 dark:hover:border-brand-500 transition-all flex items-center justify-between shadow-2xs group cursor-default',
                activeNode === 'intake' && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-0 border border-surface-200 flex items-center justify-center text-brand-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-900">1. Incident Intake</span>
                    <Badge variant="brand" size="xs">Always Runs</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500">Multi-format file upload: digital PDFs, scans, photos</p>
                </div>
              </div>
              <span className="font-mono text-2xs text-surface-400">PDF / IMG</span>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-gradient-to-b from-surface-300 to-surface-200 dark:from-surface-400 dark:to-surface-300" />
          </div>

          {/* Node 2: Document Classification */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('classifier')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-md p-4 rounded-xl border border-surface-200 bg-surface-50/70 hover:border-brand-400 dark:hover:border-brand-500 transition-all flex items-center justify-between shadow-2xs group cursor-default',
                activeNode === 'classifier' && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-0 border border-surface-200 flex items-center justify-center text-brand-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-900">2. Document Classification &amp; OCR</span>
                    <Badge variant="brand" size="xs">PyMuPDF + Vision</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500">Native text extraction with fallback to Gemini OCR</p>
                </div>
              </div>
              <span className="font-mono text-2xs text-surface-400">Tagging</span>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-gradient-to-b from-surface-300 to-surface-200 dark:from-surface-400 dark:to-surface-300" />
          </div>

          {/* Node 3: Adaptive LangGraph Supervisor */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('supervisor')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-lg p-5 rounded-xl border-2 border-brand-500/70 bg-brand-50/20 dark:bg-brand-950/40 hover:border-brand-500 transition-all shadow-md group cursor-default',
                activeNode === 'supervisor' && 'ring-2 ring-brand-500/40'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900">
                      Adaptive LangGraph Supervisor
                    </h4>
                    <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                      Dynamic StateGraph Conditional Branching
                    </span>
                  </div>
                </div>
                <Badge variant="brand" size="xs" dot>
                  Router
                </Badge>
              </div>
              <p className="text-xs text-surface-600 leading-relaxed">
                Inspects the document inventory in CaseState. Dynamically dispatches only the specialized extractors relevant to the uploaded evidence.
              </p>
            </div>

            {/* Branching Connectors to 4 Parallel Extractors */}
            <div className="w-full max-w-3xl flex flex-col items-center pt-2">
              {/* Vertical feed stem */}
              <div className="w-0.5 h-4 bg-brand-400/60" />
              {/* Horizontal spreader rail */}
              <div className="w-full border-t-2 border-brand-300 dark:border-brand-800 relative">
                <div className="absolute left-[12.5%] -top-1.5 w-3 h-3 rounded-full bg-brand-400/70 -translate-x-1/2" />
                <div className="absolute left-[37.5%] -top-1.5 w-3 h-3 rounded-full bg-brand-400/70 -translate-x-1/2" />
                <div className="absolute left-[62.5%] -top-1.5 w-3 h-3 rounded-full bg-brand-400/70 -translate-x-1/2" />
                <div className="absolute left-[87.5%] -top-1.5 w-3 h-3 rounded-full bg-brand-400/70 -translate-x-1/2" />
              </div>
              <div className="w-full grid grid-cols-4 h-4">
                <div className="border-r border-transparent flex justify-center">
                  <div className="w-0.5 h-full bg-brand-300 dark:border-brand-800" />
                </div>
                <div className="border-r border-transparent flex justify-center">
                  <div className="w-0.5 h-full bg-brand-300 dark:border-brand-800" />
                </div>
                <div className="border-r border-transparent flex justify-center">
                  <div className="w-0.5 h-full bg-brand-300 dark:border-brand-800" />
                </div>
                <div className="border-r border-transparent flex justify-center">
                  <div className="w-0.5 h-full bg-brand-300 dark:border-brand-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Parallel Extractors Grid */}
          <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PARALLEL_EXTRACTORS.map((extractor) => {
              const Icon = extractor.icon;
              return (
                <div
                  key={extractor.id}
                  onMouseEnter={() => setActiveNode(extractor.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  className={cn(
                    'p-3.5 rounded-xl border border-dashed transition-all flex flex-col justify-between shadow-2xs group cursor-default',
                    extractor.accentColor,
                    activeNode === extractor.id && 'border-solid scale-[1.02] shadow-card'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xs font-bold px-1.5 py-0.5 rounded bg-surface-0 border border-surface-200 text-surface-800">
                        {extractor.number}
                      </span>
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-surface-900 leading-snug">
                        {extractor.title}
                      </h5>
                      <p className="text-[11px] text-surface-500 mt-1 leading-normal">
                        {extractor.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-surface-200/50 mt-2 text-[10px] text-surface-400 font-medium">
                    {extractor.conditionNote}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gathering Convergence to CaseState */}
          <div className="w-full max-w-3xl flex flex-col items-center">
            {/* 4 drop stems */}
            <div className="w-full grid grid-cols-4 h-4">
              <div className="flex justify-center"><div className="w-0.5 h-full bg-surface-300 dark:bg-surface-400" /></div>
              <div className="flex justify-center"><div className="w-0.5 h-full bg-surface-300 dark:bg-surface-400" /></div>
              <div className="flex justify-center"><div className="w-0.5 h-full bg-surface-300 dark:bg-surface-400" /></div>
              <div className="flex justify-center"><div className="w-0.5 h-full bg-surface-300 dark:bg-surface-400" /></div>
            </div>
            {/* Collector Rail */}
            <div className="w-full border-t-2 border-surface-300 dark:border-surface-400" />
            <div className="w-0.5 h-6 bg-gradient-to-b from-surface-300 to-brand-500" />
          </div>

          {/* Heart: Shared Evidence / CaseState */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('casestate')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-xl p-5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/30 transition-all shadow-md group cursor-default text-center space-y-2',
                activeNode === 'casestate' && 'ring-2 ring-emerald-500/40'
              )}
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Database className="h-3.5 w-3.5" />
                <span>Shared Evidence / CaseState</span>
              </div>
              <h4 className="text-base font-bold text-surface-900">
                Single Source of Truth with Provenance
              </h4>
              <p className="text-xs text-surface-600 max-w-md mx-auto leading-relaxed">
                Every extracted fact retains its source document, page number, exact quoted text, and model confidence score. Downstream nodes read and annotate this state without altering original sources.
              </p>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-surface-300 dark:bg-surface-400" />
          </div>

          {/* Node 5: Cross-Document Consistency */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('consistency')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-md p-4 rounded-xl border border-surface-200 bg-surface-50/70 hover:border-brand-400 dark:hover:border-brand-500 transition-all flex items-center justify-between shadow-2xs group cursor-default',
                activeNode === 'consistency' && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-0 border border-surface-200 flex items-center justify-center text-rose-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <GitCompare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-900">4. Cross-Document Consistency</span>
                    <Badge variant="warning" size="xs">Diff Engine</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500">Cross-examines timestamps, narratives, and damage scopes</p>
                </div>
              </div>
              <span className="font-mono text-2xs text-surface-400">Conflict Check</span>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-surface-300 dark:bg-surface-400" />
          </div>

          {/* Node 6: Selective External Verification */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('verifier')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-md p-4 rounded-xl border border-surface-200 bg-surface-50/70 hover:border-brand-400 dark:hover:border-brand-500 transition-all flex items-center justify-between shadow-2xs group cursor-default',
                activeNode === 'verifier' && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-0 border border-surface-200 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-900">5. Selective External Verification</span>
                    <Badge variant="neutral" size="xs">Selective</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500">Queries NHTSA VIN database &amp; historical weather records</p>
                </div>
              </div>
              <span className="font-mono text-2xs text-surface-400">Gov / Weather</span>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-surface-300 dark:bg-surface-400" />
          </div>

          {/* Node 7: Explainable Assessment */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('rules')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-md p-4 rounded-xl border border-surface-200 bg-surface-50/70 hover:border-brand-400 dark:hover:border-brand-500 transition-all flex items-center justify-between shadow-2xs group cursor-default',
                activeNode === 'rules' && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-0 border border-surface-200 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-900">6. Explainable Assessment Engine</span>
                    <Badge variant="brand" size="xs">Rules-Based</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500">Deterministic triggers (TRG-MAT-01, etc.) for human review</p>
                </div>
              </div>
              <span className="font-mono text-2xs text-surface-400">Safety Guard</span>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-6 bg-surface-300 dark:bg-surface-400" />
          </div>

          {/* Node 8: Structured Investigation Report */}
          <div className="flex flex-col items-center">
            <div
              onMouseEnter={() => setActiveNode('report')}
              onMouseLeave={() => setActiveNode(null)}
              className={cn(
                'w-full max-w-lg p-5 rounded-xl border-2 border-brand-600 bg-brand-50/30 dark:bg-brand-950/50 hover:border-brand-500 transition-all shadow-md group cursor-default',
                activeNode === 'report' && 'ring-2 ring-brand-500/40'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900">
                      7. Structured Investigation Report
                    </h4>
                    <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                      Multi-Section Synthesis &amp; Print-Ready PDF
                    </span>
                  </div>
                </div>
                <Badge variant="success" size="xs">
                  Output
                </Badge>
              </div>
              <p className="text-xs text-surface-600 leading-relaxed">
                Assembles incident timeline, fact verification matrix, photographic damage classifications, and flagged contradictions into a final audit report.
              </p>
            </div>
          </div>

          {/* Call-to-Action to explore the live engine */}
          <div className="pt-6 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-surface-600">
              <Info className="h-4 w-4 text-brand-600 shrink-0" />
              <span>Explore real execution logs, node schemas, and state transitions in the engine workbench.</span>
            </div>
            <Link
              href="/engine"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors group whitespace-nowrap"
            >
              <span>Inspect Agentic Engine Telemetry</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
