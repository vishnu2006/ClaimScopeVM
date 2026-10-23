'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  ArrowRight,
  FileText,
  Camera,
  Layers,
  ShieldAlert,
  ScanLine,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarBorder } from '@/components/ui/StarBorder';
import { api } from '@/lib/api';
import { ThoughtLine } from '@/components/ui/ThoughtLine';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  tag: string;
  title: string;
  badge: string;
  badgeVariant: 'default' | 'info' | 'warning' | 'error' | 'success';
  accentBorder: string;
  documents: string[];
  docCountStr: string;
  focus: string;
  expectedOutcome: string;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'case_a',
    tag: 'Case A',
    title: 'Minor Rear-End Collision',
    badge: 'Partial Intake',
    badgeVariant: 'default',
    accentBorder: 'border-t-surface-400',
    documents: ['FNOL Intake Form (PDF)'],
    docCountStr: '1 Document (FNOL)',
    focus: 'Adaptive pipeline execution with partial records. Verifies that supervisor gracefully skips police and repair nodes without hallucinating facts.',
    expectedOutcome: 'Routine Processing with clear notation of missing supplemental records.',
    details: 'Single low-severity claim file. Tests edge condition where adjuster only has initial FNOL statement.',
    icon: FileText,
  },
  {
    id: 'case_b',
    tag: 'Case B',
    title: 'Front Collision & Damage Photos',
    badge: 'Multimodal Vision',
    badgeVariant: 'info',
    accentBorder: 'border-t-brand-500',
    documents: ['FNOL Intake Form (PDF)', 'Front Bumper Damage Photo (JPEG)', 'Quarter Panel Photo (JPEG)'],
    docCountStr: '3 Documents (1 PDF + 2 Photos)',
    focus: 'Vehicle Damage Vision Agent analyzing photos against physical severity rubrics. Cross-checks reported damage points against photo evidence.',
    expectedOutcome: 'Damage Severity Scored (Moderate) with visual provenance citations.',
    details: 'Tests multimodal vision reasoning, point-of-impact validation, and parts classification.',
    icon: Camera,
  },
  {
    id: 'case_c',
    tag: 'Case C',
    title: 'Comprehensive Incident Baseline',
    badge: 'Full Pipeline',
    badgeVariant: 'success',
    accentBorder: 'border-t-growth-500',
    documents: [
      'FNOL Intake Form (PDF)',
      'Official Police Accident Report (PDF)',
      'Itemized Body Shop Estimate (PDF)',
      'Incident Scene Photographs (JPEG)',
    ],
    docCountStr: '4 Documents (3 PDFs + Photos)',
    focus: 'End-to-end orchestration executing all LangGraph nodes: external NHTSA VIN decoding, weather lookup, and multi-document consistency check.',
    expectedOutcome: 'Routine Processing Recommended with 100% evidentiary cross-grounding.',
    details: 'Authoritative golden baseline for clean, comprehensive auto claim packages.',
    icon: Layers,
  },
  {
    id: 'case_d',
    tag: 'Case D',
    title: 'Contradictory Incident Narrative',
    badge: 'Fraud / Contradiction',
    badgeVariant: 'error',
    accentBorder: 'border-t-rose-500',
    documents: [
      'Conflicting FNOL Statement (PDF)',
      'Police Incident Report (PDF)',
      'Accident Scene Photos (JPEG)',
    ],
    docCountStr: '3 Documents (2 PDFs + Photos)',
    focus: 'Detects cross-document contradictions (daytime vs midnight, dry road vs rain), conflicting VINs, and impact points. Triggers human escalation.',
    expectedOutcome: 'Escalate for Senior Human Review with explicit side-by-side discrepancy diffs.',
    details: 'Essential insurance fraud test: system identifies red flags without making autonomous legal accusations.',
    icon: ShieldAlert,
  },
  {
    id: 'case_e',
    tag: 'Case E',
    title: 'Incomplete Scanned Intake Form',
    badge: 'Scanned OCR / Uncertainty',
    badgeVariant: 'warning',
    accentBorder: 'border-t-amber-500',
    documents: ['Scanned Claim Statement Form (PDF)'],
    docCountStr: '1 Scanned Form (Degraded)',
    focus: 'Multimodal processing on degraded or scanned forms. Tests explicit uncertainty handling: marking fields missing rather than fabricating data.',
    expectedOutcome: 'Additional Information Required with granular missing field breakdown.',
    details: 'Validates system discipline: never populating phantom coverage or fabricated vehicle numbers.',
    icon: ScanLine,
  },
];

export default function DemoLabPage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleLoadScenario = async (scenario: Scenario) => {
    setLoadingId(scenario.id);
    setErrorMsg(null);
    try {
      const res = await api.loadSyntheticCase(scenario.id);
      router.push(`/cases/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to load ${scenario.tag}: ${msg}`);
      setLoadingId(null);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Evaluation Lab &amp; Sandbox"
        subtitle="Standardized synthetic test packages to evaluate adaptive routing, multimodal vision, and fraud guardrails"
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Platform' },
          { label: 'Demo Lab' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {errorMsg && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-3.5 text-xs text-status-error font-medium flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Compact Sandbox Architecture Overview */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4.5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 mt-0.5">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-surface-900">
                1-Click Evaluated Claim Packages
              </h3>
              <p className="text-xs text-surface-500 leading-relaxed max-w-3xl">
                Each package creates an authentic claim in your local database with pre-loaded PDFs and photos. Click <strong>Load &amp; Launch</strong> to provision the files and execute the LangGraph investigation live.
              </p>
            </div>
          </div>
          <Badge variant="brand" size="sm" mono>
            5 Test Packages
          </Badge>
        </div>

        {/* ThoughtLine Loading Banner when Scenario is Loading */}
        {loadingId && (
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-brand-500/30 bg-surface-0/95 dark:bg-[#121826]/95 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <ThoughtLine
              working={Boolean(loadingId)}
              steps={[
                `Provisioning synthetic claim dossier for package ${loadingId.toUpperCase()}`,
                'Synthesizing First Notice of Loss statements & telemetry',
                'Generating damage forensic photos & police records',
                'Cataloging documents into evidence vault & redirecting',
              ]}
              label={`Provisioning & loading test claim package…`}
              doneLabel="Test package ready in"
              fontSize={14}
              showTimer
              color="var(--color-brand-600, #2563eb)"
            />
          </div>
        )}

        {/* Compact Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const isLoading = loadingId === scenario.id;
            const isExpanded = expandedId === scenario.id;

            return (
              <Card
                key={scenario.id}
                className={cn(
                  'flex flex-col justify-between hover:border-surface-300 transition-all border-surface-200 border-t-2 shadow-subtle hover:shadow-card',
                  scenario.accentBorder
                )}
              >
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header: Tag + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-surface-800 bg-surface-100 px-2 py-0.5 rounded border border-surface-200">
                          {scenario.tag}
                        </span>
                        <Badge variant={scenario.badgeVariant} size="xs">
                          {scenario.badge}
                        </Badge>
                      </div>
                      <div className="p-1.5 rounded-md bg-surface-100 text-surface-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Title & Document Count */}
                    <div>
                      <h4 className="text-sm font-bold text-surface-900 leading-snug">
                        {scenario.title}
                      </h4>
                      <p className="text-[11px] font-mono text-brand-600 font-semibold mt-0.5">
                        {scenario.docCountStr}
                      </p>
                    </div>

                    {/* Expected Outcome Pill */}
                    <div className="rounded-md bg-surface-50 p-2 border border-surface-200 text-xs">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">
                        Expected Outcome:
                      </span>
                      <p className="text-[11px] font-medium text-surface-800 mt-0.5 leading-snug">
                        {scenario.expectedOutcome}
                      </p>
                    </div>

                    {/* Expandable Technical Focus */}
                    <div>
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(scenario.id, e)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide technical focus' : 'View evaluation focus & assets'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-surface-100 space-y-2 text-xs animate-in fade-in-50 duration-150">
                          <div>
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-0.5">
                              Included Assets:
                            </span>
                            <ul className="text-[11px] text-surface-600 space-y-0.5">
                              {scenario.documents.map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 truncate">
                                  <span className="h-1 w-1 rounded-full bg-brand-500 shrink-0" />
                                  <span className="truncate">{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-0.5">
                              Agent Verification:
                            </span>
                            <p className="text-[11px] text-surface-600 leading-relaxed">
                              {scenario.focus}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <StarBorder
                      as="button"
                      onClick={() => handleLoadScenario(scenario)}
                      disabled={!!loadingId}
                      color="#086afc"
                      trailColor="#5eba46"
                      duration={3.5}
                      thickness={2}
                      radius={8}
                      glow={0.7}
                      hover="lap"
                      backgroundColor="#086afc"
                      textColor="#ffffff"
                      borderColor="rgba(8, 106, 252, 0.4)"
                      className="w-full !py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer inline-flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>{isLoading ? 'Provisioning Case...' : 'Load & Investigate'}</span>
                      {!isLoading && <ArrowRight className="h-3.5 w-3.5 ml-1.5" />}
                    </StarBorder>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
