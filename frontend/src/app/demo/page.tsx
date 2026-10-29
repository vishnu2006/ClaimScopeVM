'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Camera,
  Layers,
  ShieldAlert,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  documents: string[];
  docCountStr: string;
  description: string;
  expectedOutcome: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'case_a',
    tag: 'Case A',
    title: 'Clean Minor Parking Lot Incident',
    badge: 'Single FNOL Document',
    badgeColor: 'bg-surface-200 text-surface-800 dark:bg-surface-700 dark:text-surface-200',
    documents: ['FNOL Incident Form (PDF)'],
    docCountStr: '1 Document (FNOL)',
    description: 'Minor rear bumper contact while parked. Demonstrates routine claims review with a single First Notice of Loss statement.',
    expectedOutcome: 'Routine Processing Recommended with clear notation of missing supplemental police reports.',
    icon: FileText,
  },
  {
    id: 'case_b',
    tag: 'Case B',
    title: 'Front Collision with Photo Evidence',
    badge: 'Multimodal Vision',
    badgeColor: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
    documents: ['FNOL Intake Form (PDF)', 'Front Bumper Damage Photo (JPEG)', 'Quarter Panel Photo (JPEG)'],
    docCountStr: '3 Files (1 PDF + 2 Photographs)',
    description: 'Front-end collision into guardrail with two scene photographs. Evaluates component damage analysis and severity scoring.',
    expectedOutcome: 'Damage Severity Scored (Moderate) with visual provenance and affected components.',
    icon: Camera,
  },
  {
    id: 'case_c',
    tag: 'Case C',
    title: 'Comprehensive Rear-End Collision',
    badge: 'Complete Package',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    documents: [
      'FNOL Intake Statement (PDF)',
      'Official Police Accident Report (PDF)',
      'Certified Body Shop Estimate (PDF)',
      'Accident Scene Photographs (JPEG)',
    ],
    docCountStr: '4 Files (3 PDFs + Scene Photos)',
    description: 'Full collision package with FNOL, police collision report, itemized repair estimate, and scene photos all mutually corroborated.',
    expectedOutcome: 'Routine Claim Processing with 100% evidentiary corroboration across all documents.',
    icon: Layers,
  },
  {
    id: 'case_d',
    tag: 'Case D',
    title: 'Contradictory Narrative & VIN Mismatch',
    badge: 'Factual Discrepancies',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    documents: [
      'Conflicting FNOL Statement (PDF)',
      'Official Police Collision Report (PDF)',
      'Vehicle Damage Photographs (JPEG)',
    ],
    docCountStr: '3 Files (2 PDFs + Damage Photos)',
    description: 'Conflicting dates, opposing collision accounts between driver and police report, and a VIN suffix mismatch.',
    expectedOutcome: 'Escalate for Senior Human Review with explicit side-by-side discrepancy comparisons.',
    icon: ShieldAlert,
  },
  {
    id: 'case_e',
    tag: 'Case E',
    title: 'Incomplete Scanned Claim Statement',
    badge: 'Scanned Document / Omissions',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    documents: ['Scanned Claim Statement Form (PDF)'],
    docCountStr: '1 Scanned Statement (Degraded)',
    description: 'Handwritten/scanned statement with minimal accident details. Demonstrates uncertainty reporting without fabricating information.',
    expectedOutcome: 'Additional Information Required with a granular missing information breakdown.',
    icon: ScanLine,
  },
];

export default function DemoLabPage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadScenario = async (scenario: Scenario) => {
    setLoadingId(scenario.id);
    setErrorMsg(null);
    try {
      const res = await api.loadSyntheticCase(scenario.id);
      // Run investigation immediately so user lands on the complete scrolling dossier!
      await api.runInvestigation(res.id);
      router.push(`/cases/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to load ${scenario.tag}: ${msg}`);
      setLoadingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Sample Claims Library"
        subtitle="Five realistic auto accident claim packages with authentic documents and damage photographs"
        breadcrumbs={[
          { label: 'Sample Claims' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Overview Box */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                One-Click Sample Claims Packages
              </h2>
              <p className="text-xs text-surface-500 leading-relaxed max-w-3xl">
                Each package creates an authentic claim in your database with actual PDFs and photos. Click any claim to load the files and review the complete one-page investigation.
              </p>
            </div>
          </div>
        </div>

        {/* Loading Progress State */}
        {loadingId && (
          <div className="p-6 rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm flex items-center justify-center gap-3 text-xs text-brand-900 dark:text-brand-200 font-semibold animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span>Loading claim package and preparing investigation dossier...</span>
          </div>
        )}

        {/* Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const isLoading = loadingId === scenario.id;

            return (
              <div
                key={scenario.id}
                className="flex flex-col justify-between rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 p-6 shadow-sm hover:border-brand-500 hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Tag & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                      {scenario.tag}
                    </span>
                    <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase', scenario.badgeColor)}>
                      {scenario.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-brand-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-snug">
                        {scenario.title}
                      </h3>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed pt-1">
                      {scenario.description}
                    </p>
                  </div>

                  {/* Document Assets Included */}
                  <div className="space-y-1.5 pt-2 border-t border-surface-100 dark:border-surface-800 text-xs">
                    <div className="text-[11px] font-bold text-surface-500">
                      Submitted Files ({scenario.docCountStr}):
                    </div>
                    <div className="space-y-1">
                      {scenario.documents.map((docName, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-2 text-[11px] text-surface-600 dark:text-surface-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{docName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expected Finding */}
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 text-xs space-y-1 border border-surface-200 dark:border-surface-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                      Expected Adjudication Finding:
                    </span>
                    <p className="text-surface-700 dark:text-surface-300 text-[11px]">
                      {scenario.expectedOutcome}
                    </p>
                  </div>
                </div>

                {/* Load Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleLoadScenario(scenario)}
                    disabled={Boolean(loadingId)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Opening Dossier...</span>
                      </>
                    ) : (
                      <>
                        <span>Inspect This Claim</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
