'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Camera,
  GitCompare,
  Globe,
  ShieldCheck,
  FileCheck2,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  HelpCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { CaseState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StepCard {
  step: number;
  id: string;
  title: string;
  tagline: string;
  plainSummary: string;
  whatItDoes: string[];
  techDetails: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const FRIENDLY_STEPS: StepCard[] = [
  {
    step: 1,
    id: 'intake_classifier',
    title: 'Document Intake & Sorting',
    tagline: 'Identifies what you uploaded and prepares it for reading',
    plainSummary:
      'The engine automatically detects whether your file is an incident form, a police report, a body shop estimate, or photos. Digital text is read directly, while scanned papers and handwritten forms are processed with Google Gemini OCR.',
    whatItDoes: [
      'Scans PDF and image files immediately on upload',
      'Detects document categories (FNOL, Police, Estimate, Photo)',
      'Ensures degraded scans and faxes are transcribed legibly',
    ],
    techDetails: 'PyMuPDF Native Text Parser + Google Gemini Vision OCR fallback.',
    icon: FileText,
    accentColor: 'blue',
  },
  {
    step: 2,
    id: 'supervisor_router',
    title: 'Smart Supervisor Routing',
    tagline: 'Runs only the specialists required—skipping missing paperwork without errors',
    plainSummary:
      'Rather than running a blind script, our supervisor examines the available files. If there is no police report or repair bill, it politely skips those tasks and notes what is missing instead of crashing or generating false data.',
    whatItDoes: [
      'Checks what files exist in the case package',
      'Selects which AI specialists to launch',
      'Prevents redundant API calls and reduces costs',
    ],
    techDetails: 'LangGraph Conditional StateGraph with deterministic branching.',
    icon: Cpu,
    accentColor: 'indigo',
  },
  {
    step: 3,
    id: 'extractors',
    title: 'Specialized Data Extraction',
    tagline: 'Extracts exact names, policy numbers, accident facts, and costs',
    plainSummary:
      'Trained AI specialists read each document type and pull out verified fields (driver identity, vehicle VIN, collision dates, damage descriptions, and itemized parts costs). Every extracted fact tracks its original page and document citation.',
    whatItDoes: [
      'Pulls claimant details, vehicle info, and loss stories from FNOL',
      'Extracts officer narrative, citations, and roadway conditions from police reports',
      'Itemizes body shop replacement parts, paint labor hours, and totals',
    ],
    techDetails: 'Google Gemini (gemini-3.5-flash-lite) with strictly validated Pydantic schemas.',
    icon: Search,
    accentColor: 'cyan',
  },
  {
    step: 4,
    id: 'vision_agent',
    title: 'Photographic Damage Inspection',
    tagline: 'Examines vehicle accident photos like an experienced appraiser',
    plainSummary:
      'Our vision agent inspects vehicle photos to identify damaged areas (bumpers, headlights, quarter panels, wheels) and rates severity from minor scuffs to severe frame damage. It notes camera quality limitations so human adjusters stay informed.',
    whatItDoes: [
      'Locates visible impact zones on the vehicle',
      'Classifies damage severity (Minor, Moderate, Severe, Total Loss)',
      'Flags photo quality issues like darkness or blurry angles',
    ],
    techDetails: 'Google Gemini Multimodal Vision analysis against standard physical damage rubrics.',
    icon: Camera,
    accentColor: 'purple',
  },
  {
    step: 5,
    id: 'consistency_agent',
    title: 'Cross-Check & Contradiction Detection',
    tagline: 'Compares what the driver said vs. what police and photos prove',
    plainSummary:
      'The engine cross-checks all accounts side-by-side. If a driver claims they hit a deer while parked, but the police report cites a red-light collision into a pole, ClaimScope immediately flags the discrepancy for review.',
    whatItDoes: [
      'Detects VIN, license plate, and make/model mismatches',
      'Catches conflicting impact points between driver narrative and police record',
      'Flags damage severity claims that contradict uploaded photographs',
    ],
    techDetails: 'Comparative multi-document semantic reasoning with structured conflict diffs.',
    icon: GitCompare,
    accentColor: 'rose',
  },
  {
    step: 6,
    id: 'external_verifier',
    title: 'Public Database Verification',
    tagline: 'Verifies real facts against government vehicle registries and weather history',
    plainSummary:
      'Without web scraping or guesswork, the system queries official government and scientific databases: decoding the VIN through the federal NHTSA registry and verifying weather conditions through historical weather records.',
    whatItDoes: [
      'NHTSA VIN Lookup: Confirms genuine make, model, plant country, and year',
      'Historical Weather: Checks if it actually rained or snowed at that location on the collision date',
      'Repair Benchmarks: Compares body shop labor rates against regional standards',
    ],
    techDetails: 'US Department of Transportation (NHTSA vPIC) API + Open-Meteo Historical Archive.',
    icon: Globe,
    accentColor: 'emerald',
  },
  {
    step: 7,
    id: 'assessment_engine',
    title: 'Insurance Rules Assessment',
    tagline: 'Categorizes the claim into clear, explainable adjuster action tiers',
    plainSummary:
      'ClaimScope never makes autonomous legal decisions or automated denials. Instead, it follows transparent NAIC-compliant insurance rules to suggest the next step for human adjusters: Routine Review, Additional Info Needed, or Human Escalate.',
    whatItDoes: [
      'Calculates an objective, explainable risk score (0 to 1)',
      'Assigns recommended tier with clear reasons (e.g. TRG-MAT-01 for story conflicts)',
      'Recommends concrete checklist tasks for human adjusters to follow up on',
    ],
    techDetails: 'Deterministic NAIC MDL-900 decision-support rules engine.',
    icon: ShieldCheck,
    accentColor: 'amber',
  },
  {
    step: 8,
    id: 'synthesis_agent',
    title: 'Institutional Audit Report',
    tagline: 'Synthesizes all findings into a clean summary and downloadable PDF',
    plainSummary:
      'Everything is packaged into an executive investigation summary and a professional multi-page PDF with official headers, discrepancy tables, and evidentiary provenance ready for underwriting and legal files.',
    whatItDoes: [
      'Produces an executive summary matrix for quick reading',
      'Generates a formal, printable multi-page PDF investigation packet',
      'Maintains an audit trail of every fact and document source',
    ],
    techDetails: 'Python ReportLab 5.0 institutional PDF generation engine.',
    icon: FileCheck2,
    accentColor: 'teal',
  },
];

export default function AgenticEnginePage() {
  const { cases } = useCases();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [liveState, setLiveState] = useState<CaseState | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

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
        title="Agentic Engine &amp; Workflow"
        subtitle="How ClaimScope's AI investigates automobile accident claims step-by-step"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agentic Engine' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Simple Plain-English Banner */}
        <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-surface-0 via-surface-0 to-brand-50/40 dark:to-brand-950/20 p-6 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Transparent Multi-Agent Workflow</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-surface-900">
                How ClaimScope Investigates an Incident
              </h2>
              <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                Rather than treating AI as an unpredictable black-box chatbot, ClaimScope runs a sequence of specialized, single-purpose agents. Each step does one job thoroughly, double-checks facts against external public records, and cites every source.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <div className="rounded-xl bg-surface-100/70 border border-surface-200 px-3 py-2 text-center">
                <div className="text-base font-bold text-surface-900">8 Steps</div>
                <div className="text-[10px] text-surface-500 font-medium">Clear Stages</div>
              </div>
              <div className="rounded-xl bg-surface-100/70 border border-surface-200 px-3 py-2 text-center">
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-[10px] text-surface-500 font-medium">Traceable Sources</div>
              </div>
              <div className="rounded-xl bg-surface-100/70 border border-surface-200 px-3 py-2 text-center">
                <div className="text-base font-bold text-brand-600 dark:text-brand-400">Human-In-Loop</div>
                <div className="text-[10px] text-surface-500 font-medium">Assists Adjuster</div>
              </div>
            </div>
          </div>
        </div>

        {/* 8 Clear Visual Step Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider text-[11px]">
              Investigation Journey (8 Steps)
            </h3>
            <span className="text-xs text-surface-500">
              Click any step to reveal what happens behind the scenes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FRIENDLY_STEPS.map((step) => {
              const Icon = step.icon;
              const isExpanded = !!expandedSteps[step.step];

              return (
                <div
                  key={step.step}
                  className={cn(
                    'rounded-xl border border-surface-200 bg-surface-0 transition-all overflow-hidden shadow-2xs self-start',
                    isExpanded
                      ? 'border-brand-500/80 ring-2 ring-brand-500/10 dark:ring-brand-500/20 shadow-card'
                      : 'hover:border-surface-300 hover:shadow-subtle'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleStep(step.step)}
                    className="w-full p-4 flex items-start justify-between text-left cursor-pointer transition-colors hover:bg-surface-50/50"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-700 font-bold text-sm">
                        <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-brand-600 dark:text-brand-400">
                            STEP {step.step}
                          </span>
                          <h4 className="text-xs font-bold text-surface-900 truncate">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">
                          {step.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pt-1 text-surface-400">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Plain English Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-surface-100 dark:border-surface-200 bg-surface-50/40 space-y-3.5 animate-fade-in text-xs">
                      <p className="text-surface-700 leading-relaxed text-xs">
                        {step.plainSummary}
                      </p>

                      <div className="space-y-1.5 bg-surface-0 dark:bg-surface-100/40 p-3 rounded-lg border border-surface-200">
                        <span className="font-semibold text-surface-900 uppercase tracking-wider text-[10px] block">
                          Key Responsibilities:
                        </span>
                        <ul className="space-y-1">
                          {step.whatItDoes.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-surface-600 text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-[11px] text-surface-500 pt-1 border-t border-surface-200/60 flex items-center justify-between">
                        <span><strong>Engine Component:</strong> {step.techDetails}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Case Execution Telemetry (Interactive Inspection) */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-surface-900">
                  Live Case Execution Telemetry
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                  Live Pipeline Inspector
                </span>
              </div>
              <p className="text-xs text-surface-500 mt-0.5">
                Select any incident to see exactly which agents ran, which skipped, and why
              </p>
            </div>

            {/* Case Selector Dropdown */}
            {cases && cases.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 font-medium">Select Incident:</span>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title.substring(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingTelemetry ? (
            <div className="p-8 text-center text-xs text-surface-500">
              Loading execution telemetry...
            </div>
          ) : !liveState || !liveState.agent_executions || liveState.agent_executions.length === 0 ? (
            <div className="p-8 text-center text-xs text-surface-500 bg-surface-50 rounded-lg border border-dashed border-surface-200">
              <p className="font-medium text-surface-700">No agent run recorded for this claim yet.</p>
              <p className="mt-1 text-surface-500">Open this case in the workbench and click &quot;Run Adaptive Investigation&quot; to execute all steps.</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-surface-600 bg-surface-50 p-3 rounded-lg border border-surface-200">
                <div className="flex items-center gap-2">
                  <span>Case Number: <strong className="font-mono text-surface-900">{liveState.case_number}</strong></span>
                  <span>•</span>
                  <span>Investigation Stage: <Badge variant="brand" size="xs">{liveState.current_stage || 'Complete'}</Badge></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {liveState.agent_executions.filter((e) => e.status === 'completed').length} Steps Executed
                  </span>
                  <span>•</span>
                  <span className="text-surface-500">
                    {liveState.agent_executions.filter((e) => e.status === 'skipped').length} Skipped (Absent Docs)
                  </span>
                </div>
              </div>

              {/* Execution Records Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {liveState.agent_executions.map((rec) => (
                  <div
                    key={rec.agent_id}
                    className="p-3 rounded-lg border border-surface-200 bg-surface-0 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-surface-900 truncate">
                        {rec.display_name || rec.agent_id}
                      </div>
                      <p className="text-[11px] text-surface-500 line-clamp-2">
                        {rec.skip_reason ? (
                          <span className="italic text-surface-400">{rec.skip_reason}</span>
                        ) : rec.error_message ? (
                          <span className="text-status-error font-mono">{rec.error_message}</span>
                        ) : rec.status === 'completed' ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Successfully processed and validated.</span>
                        ) : (
                          'Active node.'
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {rec.status === 'completed' && (
                        <Badge variant="success" size="xs" dot>
                          Executed
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
