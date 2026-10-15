'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  ArrowRight,
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Scenario {
  id: string;
  tag: string;
  title: string;
  badge: string;
  badgeVariant: 'default' | 'info' | 'warning' | 'error' | 'success';
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
    documents: ['FNOL Intake Form (PDF)'],
    docCountStr: '1 Document',
    focus: 'Adaptive pipeline execution with partial documents. Verifies that the supervisor skips police, estimate, and vision agents without hallucinating missing data.',
    expectedOutcome: 'Routine Processing with clear notation of missing supplemental records.',
    details: 'Single low-severity claim file. Tests edge condition where adjuster only has initial FNOL statement.',
    icon: FileText,
  },
  {
    id: 'case_b',
    tag: 'Case B',
    title: 'Front Collision with Photo Evidence',
    badge: 'Multimodal Vision',
    badgeVariant: 'info',
    documents: ['FNOL Intake Form (PDF)', 'Front Bumper Damage Photo (JPEG)', 'Quarter Panel Photo (JPEG)'],
    docCountStr: '3 Documents (1 PDF + 2 Photos)',
    focus: 'Vehicle Damage Vision Agent analyzing photos against a standardized severity rubric. Cross-checks reported damage location against photographic evidence.',
    expectedOutcome: 'Damage Severity Scored (Moderate) with visual provenance citations.',
    details: 'Tests multimodal vision reasoning, point-of-impact validation, and parts classification.',
    icon: Camera,
  },
  {
    id: 'case_c',
    tag: 'Case C',
    title: 'Comprehensive Package & Baseline',
    badge: 'Full Pipeline',
    badgeVariant: 'success',
    documents: [
      'FNOL Intake Form (PDF)',
      'Official Police Accident Report (PDF)',
      'Itemized Body Shop Estimate (PDF)',
      'Incident Scene Photographs (JPEG)',
    ],
    docCountStr: '4 Documents (3 PDFs + Photos)',
    focus: 'Complete end-to-end orchestration with all 7 LangGraph nodes executing. Verifies external NHTSA VIN decoding, weather lookup, and multi-document fact agreement.',
    expectedOutcome: 'Routine Processing Recommended with 100% evidentiary cross-grounding.',
    details: 'Authoritative golden baseline for clean, comprehensive auto claim packages.',
    icon: Layers,
  },
  {
    id: 'case_d',
    tag: 'Case D',
    title: 'Contradictory Staged Collision',
    badge: 'Fraud / Contradiction',
    badgeVariant: 'error',
    documents: [
      'Conflicting FNOL Statement (PDF)',
      'Police Incident Report (PDF)',
      'Accident Scene Photos (JPEG)',
    ],
    docCountStr: '3 Documents (2 PDFs + Photos)',
    focus: 'Detects narrative contradictions (daytime vs midnight, dry road vs rain), conflicting VINs across documents, and mismatched impact points. Enforces explainable escalation.',
    expectedOutcome: 'Escalate for Senior Human Review with explicit side-by-side discrepancy diffs.',
    details: 'Essential insurance fraud test: system identifies red flags without making autonomous legal fraud accusations.',
    icon: ShieldAlert,
  },
  {
    id: 'case_e',
    tag: 'Case E',
    title: 'Incomplete Scanned Intake Form',
    badge: 'Scanned OCR / Uncertainty',
    badgeVariant: 'warning',
    documents: ['Scanned Claim Statement Form (PDF)'],
    docCountStr: '1 Scanned Document',
    focus: 'Multimodal document processing on degraded or scanned documents. Tests explicit uncertainty handling where incomplete data is marked missing rather than fabricated.',
    expectedOutcome: 'Additional Information Required with granular missing field breakdown.',
    details: 'Validates system discipline: never populating phantom coverage or fabricated vehicle numbers.',
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
      router.push(`/cases/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to load ${scenario.tag}: ${msg}`);
      setLoadingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Evaluation Lab & Sandbox"
        subtitle="Standardized synthetic test packages to evaluate adaptive routing, multimodal vision, and fraud guardrails"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Demo Lab' },
        ]}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
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

        {/* Sandbox Architecture Note */}
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-brand-50 text-brand-600 mt-0.5">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-surface-900">
                Automated 1-Click Incident Package Ingestion
              </h3>
              <p className="text-xs text-surface-600 leading-relaxed max-w-3xl">
                Each evaluation package below initializes a dedicated case in your PostgreSQL database, provisions authentic PDF documents and photographic assets, and allows you to test the adaptive LangGraph investigation pipeline in real time.
              </p>
            </div>
          </div>
          <Badge variant="brand" size="md" mono>
            5 Evaluation Scenarios
          </Badge>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const isLoading = loadingId === scenario.id;

            return (
              <Card
                key={scenario.id}
                className="flex flex-col justify-between hover:border-surface-300 transition-all border-surface-200"
              >
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header: Tag + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-surface-800 bg-surface-100 px-2 py-0.5 rounded border border-surface-200">
                          {scenario.tag}
                        </span>
                        <Badge variant={scenario.badgeVariant} size="sm">
                          {scenario.badge}
                        </Badge>
                      </div>
                      <div className="p-1.5 rounded bg-surface-100 text-surface-500">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-bold text-surface-900 leading-tight">
                        {scenario.title}
                      </h4>
                      <p className="text-[11px] font-mono text-brand-600 mt-0.5">
                        {scenario.docCountStr}
                      </p>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-1 pt-1 border-t border-surface-100">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">
                        Included Assets:
                      </span>
                      <ul className="text-[11px] text-surface-600 space-y-0.5">
                        {scenario.documents.map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="h-1 w-1 rounded-full bg-surface-400 shrink-0" />
                            <span className="truncate">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Test Focus */}
                    <div className="space-y-1 pt-2 border-t border-surface-100">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">
                        Evaluation Focus:
                      </span>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        {scenario.focus}
                      </p>
                    </div>

                    {/* Expected Outcome */}
                    <div className="rounded bg-surface-50 p-2.5 border border-surface-200 space-y-1">
                      <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                        Expected Outcome:
                      </span>
                      <p className="text-[11px] font-medium text-surface-800">
                        {scenario.expectedOutcome}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleLoadScenario(scenario)}
                      loading={isLoading}
                      disabled={!!loadingId}
                      rightIcon={!isLoading ? <ArrowRight className="h-3.5 w-3.5" /> : undefined}
                    >
                      <span>{isLoading ? 'Provisioning Case...' : 'Load & Launch Workbench'}</span>
                    </Button>
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
