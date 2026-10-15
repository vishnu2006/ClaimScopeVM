'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  FileText,
  Camera,
  GitCompare,
  Globe,
  ShieldCheck,
  FileCheck2,
  ShieldAlert,
  Layers,
  Database,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { CaseState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GraphNode {
  id: string;
  name: string;
  stage: string;
  role: string;
  model: string;
  input: string;
  output: string;
  conditions: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'intake_classifier',
    name: '1. Document Classifier',
    stage: 'Intake Stage',
    role: 'Classifies uploaded files into FNOL, Police Report, Repair Estimate, Damage Photo, or Scanned Form.',
    model: 'PyMuPDF Native Text + Gemini 2.5 Flash',
    input: 'Raw file bytes (PDF / JPEG / PNG)',
    output: 'Document classification tag, page count, OCR flag',
    conditions: 'Always runs on every uploaded file.',
    icon: FileText,
  },
  {
    id: 'supervisor_router',
    name: '2. Supervisor Router',
    stage: 'Orchestration Stage',
    role: 'Inspects document inventory in CaseState and determines which specialized extraction agents to dispatch.',
    model: 'Deterministic Logic Router',
    input: 'Document inventory list in CaseState',
    output: 'Conditional execution routing plan',
    conditions: 'Always runs. Dispatches only applicable downstream nodes.',
    icon: Cpu,
  },
  {
    id: 'fnol_extractor',
    name: '3a. FNOL Extraction Agent',
    stage: 'Specialized Extraction',
    role: 'Extracts structured policy, claimant, vehicle, and incident narrative details with field-level provenance.',
    model: 'Gemini 2.5 Flash (Structured Pydantic)',
    input: 'First Notice of Loss text / scan',
    output: 'Structured FNOLExtraction object with confidence scores',
    conditions: 'Conditional: Executes only if FNOL document exists in package.',
    icon: FileText,
  },
  {
    id: 'police_extractor',
    name: '3b. Police Report Agent',
    stage: 'Specialized Extraction',
    role: 'Parses official law enforcement narrative, citations, roadway conditions, weather, and involved parties.',
    model: 'Gemini 2.5 Flash (Structured Pydantic)',
    input: 'Police accident report PDF / scan',
    output: 'Structured PoliceReportExtraction object',
    conditions: 'Conditional: Skips gracefully if police report is not submitted.',
    icon: ShieldAlert,
  },
  {
    id: 'estimate_extractor',
    name: '3c. Repair Estimate Agent',
    stage: 'Specialized Extraction',
    role: 'Parses itemized body shop repair estimates, parts operations (replace/repair), labor hours, and total costs.',
    model: 'Gemini 2.5 Flash (Structured Pydantic)',
    input: 'Certified repair estimate PDF',
    output: 'Itemized RepairEstimateExtraction object',
    conditions: 'Conditional: Skips if no body shop estimate is present.',
    icon: FileText,
  },
  {
    id: 'vision_agent',
    name: '3d. Vehicle Damage Vision Agent',
    stage: 'Specialized Vision',
    role: 'Evaluates incident scene and vehicle photos against a standardized damage severity rubric (Minor, Moderate, Severe).',
    model: 'Gemini 2.5 Flash Vision Multimodal',
    input: 'JPEG / PNG damage photographs',
    output: 'Damage classification, impact point, severity score',
    conditions: 'Conditional: Skips if zero photographs are uploaded.',
    icon: Camera,
  },
  {
    id: 'consistency_agent',
    name: '4. Consistency & Conflict Agent',
    stage: 'Multi-Document Reasoning',
    role: 'Cross-examines all extracted facts across FNOL, police report, estimate, and photos to identify contradictions.',
    model: 'Gemini 2.5 Flash (Comparative Reasoning)',
    input: 'Consolidated extraction dictionary in CaseState',
    output: 'List of InconsistencyFinding objects (diff, source A, source B)',
    conditions: 'Always runs when 2+ documents are present in package.',
    icon: GitCompare,
  },
  {
    id: 'external_verifier',
    name: '5. External Grounding Verifier',
    stage: 'External Public Verification',
    role: 'Selectively queries external authorities to verify VIN specifications (NHTSA) and historical weather (Open-Meteo).',
    model: 'REST Integration (NHTSA vPIC & Open-Meteo)',
    input: 'Extracted 17-char VIN, incident GPS/city, incident timestamp',
    output: 'Verified vehicle specs, actual weather conditions archive',
    conditions: 'Selectively invoked when verifiable VIN or weather parameters exist.',
    icon: Globe,
  },
  {
    id: 'assessment_engine',
    name: '6. Rules Assessment Engine',
    stage: 'Deterministic Assessment',
    role: 'Applies transparent insurance rules to recommend outcome (ROUTINE_REVIEW, ADDITIONAL_INFO, ESCALATE).',
    model: 'Deterministic Rule Engine',
    input: 'Extractions, discrepancies, verifications, document completeness',
    output: 'Outcome recommendation with explicit trigger codes (TRG-MAT-01, etc.)',
    conditions: 'Always runs. Enforces human-in-the-loop regulatory safety.',
    icon: ShieldCheck,
  },
  {
    id: 'synthesis_agent',
    name: '7. Synthesis & Report Compiler',
    stage: 'Reporting Stage',
    role: 'Compiles multi-document findings, discrepancies, confidence matrix, and adjuster action items into an audit report.',
    model: 'Gemini 2.5 Flash + PDF Generator',
    input: 'Final CaseState',
    output: 'Structured InvestigationReport & downloadable PDF',
    conditions: 'Terminal node of LangGraph StateGraph.',
    icon: FileCheck2,
  },
];

export default function AgenticEnginePage() {
  const { cases } = useCases();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [liveState, setLiveState] = useState<CaseState | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  // Set initial case selection
  useEffect(() => {
    let mounted = true;
    if (cases && cases.length > 0 && !selectedCaseId) {
      Promise.resolve().then(() => {
        if (mounted) setSelectedCaseId(cases[0].id);
      });
    }
    return () => {
      mounted = false;
    };
  }, [cases, selectedCaseId]);

  // Fetch real investigation telemetry when case changes
  useEffect(() => {
    let mounted = true;
    if (!selectedCaseId) return;
    Promise.resolve().then(() => {
      if (mounted) setLoadingTelemetry(true);
    });
    api.getInvestigation(selectedCaseId)
      .then((state) => {
        if (mounted) setLiveState(state);
      })
      .catch(() => {
        if (mounted) setLiveState(null);
      })
      .finally(() => {
        if (mounted) setLoadingTelemetry(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedCaseId]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Agentic Engine Architecture"
        subtitle="Conditional LangGraph orchestration with single-source-of-truth CaseState telemetry"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agentic Engine' },
        ]}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Concise Architecture Overview */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                <Cpu className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-surface-900">
                LangGraph Adaptive State Machine
              </h2>
            </div>
            <p className="text-xs text-surface-600 max-w-2xl">
              An intelligent supervisor inspects uploaded evidence and conditionally branches execution—running only the extractors needed, skipping absent documents gracefully, and updating shared CaseState.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="brand" size="xs" mono>
              10 Nodes
            </Badge>
            <Badge variant="neutral" size="xs" mono>
              Gemini 2.5 Flash
            </Badge>
            <Badge variant="success" size="xs" mono>
              Acyclic Loops
            </Badge>
          </div>
        </div>

        {/* Live Case Execution Telemetry (Interactive DB Data) */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-surface-900">
                  Case Execution Telemetry
                </h3>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                  Live Database
                </span>
              </div>
              <p className="text-xs text-surface-500">
                Inspect node execution status, runtimes, and skip rationale for any case
              </p>
            </div>

            {/* Case Selector Dropdown */}
            {cases && cases.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 font-medium">Select Case:</span>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="rounded-md border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingTelemetry ? (
            <div className="p-6 text-center text-xs text-surface-500">
              Loading execution telemetry...
            </div>
          ) : !liveState || !liveState.agent_executions || liveState.agent_executions.length === 0 ? (
            <div className="p-6 text-center text-xs text-surface-500 bg-surface-50 rounded-lg border border-dashed border-surface-200">
              <p className="font-medium text-surface-700">No LangGraph execution recorded for this case yet.</p>
              <p className="mt-1 text-surface-500">Open the case workbench and click &quot;Run Adaptive Investigation&quot; to execute the pipeline.</p>
              {selectedCaseId && (
                <Link href={`/cases/${selectedCaseId}`} className="mt-3 inline-block">
                  <Button variant="primary" size="xs">
                    Open Case Workbench
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>
                  Case: <strong className="font-mono text-surface-900">{liveState.case_number}</strong> • Stage:{' '}
                  <Badge variant="brand" size="xs">
                    {liveState.current_stage || 'Complete'}
                  </Badge>
                </span>
                <span className="font-mono text-[11px]">
                  {liveState.agent_executions.filter((e) => e.status === 'completed').length} Executed •{' '}
                  {liveState.agent_executions.filter((e) => e.status === 'skipped').length} Skipped
                </span>
              </div>

              {/* Compact Execution Records Table */}
              <div className="overflow-x-auto rounded-lg border border-surface-200">
                <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
                  <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Agent Node</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Skip Rationale / Details</th>
                      <th className="px-4 py-2">Extracted Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 font-normal">
                    {liveState.agent_executions.map((rec) => (
                      <tr key={rec.agent_id} className="hover:bg-surface-50/60 transition-colors">
                        <td className="px-4 py-2 font-semibold text-surface-900 whitespace-nowrap">
                          {rec.display_name || rec.agent_id}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {rec.status === 'completed' && (
                            <Badge variant="success" size="xs" dot>
                              Completed
                            </Badge>
                          )}
                          {rec.status === 'skipped' && (
                            <Badge variant="neutral" size="xs">
                              Skipped
                            </Badge>
                          )}
                          {rec.status === 'failed' && (
                            <Badge variant="error" size="xs" dot>
                              Failed
                            </Badge>
                          )}
                          {rec.status === 'pending' && (
                            <Badge variant="pending" size="xs">
                              Running
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 text-surface-600 text-[11px] max-w-xs">
                          {rec.skip_reason && <span className="italic text-surface-500">{rec.skip_reason}</span>}
                          {rec.error_message && <span className="text-status-error font-mono">{rec.error_message}</span>}
                          {!rec.skip_reason && !rec.error_message && (
                            <span className="text-surface-400 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-[10px] font-mono text-surface-600">
                          {rec.details && Object.keys(rec.details).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(rec.details).map(([k, v]) => (
                                <span key={k} className="bg-surface-100 px-1.5 py-0.2 rounded border border-surface-200">
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-surface-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Visual Progressive Disclosure: 10 Architecture Nodes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900">
                Graph Node Contracts &amp; Conditional Triggers
              </h3>
              <p className="text-xs text-surface-500">
                Click any node to inspect model input/output contracts and conditional routing guards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GRAPH_NODES.map((node) => {
              const Icon = node.icon;
              const isExpanded = expandedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  className={cn(
                    'rounded-lg border border-surface-200 bg-surface-0 transition-all overflow-hidden shadow-2xs',
                    isExpanded ? 'border-brand-400/80 ring-1 ring-brand-400/20' : 'hover:border-surface-300'
                  )}
                >
                  {/* Collapsed Header / Clickable Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                    className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-surface-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-surface-100 text-surface-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-900">{node.name}</span>
                          <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold uppercase">
                            {node.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-surface-500 line-clamp-1 mt-0.5">{node.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="neutral" size="xs" mono>
                        {node.id}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-surface-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-surface-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Technical Details */}
                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-1 border-t border-surface-100 dark:border-surface-200 bg-surface-50/40 text-xs space-y-2 animate-fade-in">
                      <p className="text-surface-700 text-xs leading-relaxed">{node.role}</p>
                      <div className="grid grid-cols-1 gap-1 text-[11px]">
                        <div>
                          <strong className="text-surface-600">Model:</strong>{' '}
                          <span className="font-mono text-surface-800">{node.model}</span>
                        </div>
                        <div>
                          <strong className="text-surface-600">Input:</strong>{' '}
                          <span className="text-surface-700">{node.input}</span>
                        </div>
                        <div>
                          <strong className="text-surface-600">Output:</strong>{' '}
                          <span className="text-surface-700">{node.output}</span>
                        </div>
                      </div>
                      <div className="text-brand-700 dark:text-brand-300 font-medium bg-brand-50/70 dark:bg-brand-950/40 p-2 rounded border border-brand-200 dark:border-brand-900/60 text-[11px]">
                        <strong>Conditional Rule:</strong> {node.conditions}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Core Architecture Pillars (Concise) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs">
              <Database className="h-3.5 w-3.5" />
              <span>Shared CaseState</span>
            </div>
            <p className="text-[11px] text-surface-600 leading-relaxed">
              Central Pydantic model with immutable timestamps ensures deterministic trace replayability across agent nodes.
            </p>
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Evidence Provenance</span>
            </div>
            <p className="text-[11px] text-surface-600 leading-relaxed">
              Every fact is wrapped in <code>FieldWithProvenance[T]</code> citing document name, page, and exact quotes.
            </p>
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Bounded Graph Execution</span>
            </div>
            <p className="text-[11px] text-surface-600 leading-relaxed">
              LangGraph StateGraph edges are strictly acyclic per processing pass to prevent runaway token costs and infinite loops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
