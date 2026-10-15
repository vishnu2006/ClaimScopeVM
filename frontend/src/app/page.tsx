'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  FolderOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Activity,
  Layers,
} from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecentCasesTable } from '@/components/cases/RecentCasesTable';
import { CaseStatus } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();

  // Aggregate stats from persisted case records
  const totalCases = cases ? cases.length : 0;

  const stats = React.useMemo(() => {
    if (!cases) {
      return { active: 0, flagged: 0, completed: 0, highPriority: 0 };
    }
    let active = 0;
    let flagged = 0;
    let completed = 0;
    let highPriority = 0;

    cases.forEach((c) => {
      if (['open', 'new', 'processing', 'in_progress'].includes(c.status)) {
        active++;
      }
      if (['flagged', 'in_review'].includes(c.status)) {
        flagged++;
      }
      if (['completed', 'investigation_complete', 'report_generated', 'closed'].includes(c.status)) {
        completed++;
      }
      if (['high', 'critical'].includes(c.priority)) {
        highPriority++;
      }
    });

    return { active, flagged, completed, highPriority };
  }, [cases]);

  // Sort recent cases by created_at descending
  const recentCases = React.useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Compact Operational Header */}
      <section className="border-b border-surface-200 bg-surface-0 px-6 py-4 shadow-subtle">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-surface-900">
                Investigation Operations
              </h1>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                US P&amp;C Auto
              </span>
            </div>
            <p className="text-xs text-surface-500">
              Multi-document intake, cross-file consistency reasoning, and evidence verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/demo')}
              leftIcon={<FlaskConical className="h-3.5 w-3.5 text-brand-600" />}
            >
              Demo Lab
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/cases/new')}
              leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
            >
              New Claim Intake
            </Button>
          </div>
        </div>
      </section>

      {/* Main Operational Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={4} />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Operational Data"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Cases */}
              <Card className="p-4 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                    Total Ingested
                  </span>
                  <FolderOpen className="h-4 w-4 text-surface-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-surface-900">
                    {totalCases}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">all records</span>
                </div>
              </Card>

              {/* Active / Processing */}
              <Card className="p-4 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                    Active Intake
                  </span>
                  <Clock className="h-4 w-4 text-brand-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-brand-700">
                    {stats.active}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">in queue</span>
                </div>
              </Card>

              {/* High / Critical Priority */}
              <Card className="p-4 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                    Priority / Flagged
                  </span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-amber-700">
                    {stats.flagged || stats.highPriority}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">require attention</span>
                </div>
              </Card>

              {/* Completed */}
              <Card className="p-4 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                    Synthesized
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-emerald-700">
                    {stats.completed}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">investigations complete</span>
                </div>
              </Card>
            </div>

            {/* Quick Demo Lab Banner */}
            <div className="rounded-lg border border-surface-200 bg-surface-0 p-3.5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-surface-100 text-surface-600">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-surface-900">
                    Standardized Evaluation Packages Available
                  </h4>
                  <p className="text-[11px] text-surface-500">
                    Test partial intake, vision analysis, fraud contradiction checks, and scanned OCR in the Demo Lab.
                  </p>
                </div>
              </div>

              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors shrink-0"
              >
                <span>Launch Demo Lab</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Recent Investigations Table Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-surface-900">
                    Recent Claim Investigations
                  </h2>
                  <p className="text-xs text-surface-500">
                    Live feed of incident packages processed through the investigation pipeline
                  </p>
                </div>

                {totalCases > 0 && (
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-surface-600 hover:text-brand-600 transition-colors"
                  >
                    <span>View all cases ({totalCases})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {recentCases.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No active claims in workspace"
                  description="Begin by creating a new claim case or loading a pre-configured scenario from the Demo Lab."
                  actionLabel="Create New Claim"
                  onAction={() => router.push('/cases/new')}
                />
              ) : (
                <RecentCasesTable cases={recentCases} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
