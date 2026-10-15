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
  Cpu,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatPriority, formatStatus, getPriorityBadgeVariant, getStatusBadgeVariant } from '@/lib/utils';
import { CaseSummary } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();

  // Aggregate metrics derived strictly from actual persisted cases
  const totalCases = cases ? cases.length : 0;

  const { activeCases, reviewCases, completedCases, recentCases, priorityDistribution } = React.useMemo(() => {
    if (!cases) {
      return {
        activeCases: 0,
        reviewCases: [] as CaseSummary[],
        completedCases: 0,
        recentCases: [] as CaseSummary[],
        priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
      };
    }

    let active = 0;
    let completed = 0;
    const reviewList: CaseSummary[] = [];
    const priorityDist = { critical: 0, high: 0, medium: 0, low: 0 };

    cases.forEach((c) => {
      // Priority count
      if (c.priority in priorityDist) {
        priorityDist[c.priority as keyof typeof priorityDist]++;
      }

      // Active intake
      if (['open', 'new', 'processing', 'in_progress'].includes(c.status)) {
        active++;
      }

      // Review queue: flagged or high priority
      if (['flagged', 'in_review'].includes(c.status) || ['critical', 'high'].includes(c.priority)) {
        reviewList.push(c);
      }

      // Completed
      if (['completed', 'investigation_complete', 'report_generated', 'closed'].includes(c.status)) {
        completed++;
      }
    });

    const sortedRecent = [...cases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);

    return {
      activeCases: active,
      reviewCases: reviewList.slice(0, 5),
      completedCases: completed,
      recentCases: sortedRecent,
      priorityDistribution: priorityDist,
    };
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Workspace Header */}
      <section className="border-b border-surface-200 bg-surface-0 px-6 py-5 shadow-subtle">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Claims Operational Cockpit
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                P&amp;C Operations
              </span>
            </div>
            <p className="text-xs text-surface-500">
              Live overview of active intakes, flagged contradictions, and synthesized investigation reports
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/demo')}
              leftIcon={<FlaskConical className="h-4 w-4 text-brand-600" />}
            >
              Demo Lab
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/engine')}
              leftIcon={<Cpu className="h-4 w-4 text-surface-600" />}
            >
              Agentic Engine
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/cases/new')}
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              New Investigation
            </Button>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={4} />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Dashboard Telemetry"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            {/* 4 Core KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Total Ingested
                  </span>
                  <div className="p-1.5 rounded-md bg-surface-100 text-surface-600">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-surface-900">
                    {totalCases}
                  </span>
                  <span className="text-xs text-surface-500">total cases</span>
                </div>
              </Card>

              <Card className="p-5 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Active Intake
                  </span>
                  <div className="p-1.5 rounded-md bg-brand-50 text-brand-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-brand-700">
                    {activeCases}
                  </span>
                  <span className="text-xs text-surface-500">processing pipeline</span>
                </div>
              </Card>

              <Card className="p-5 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Attention Required
                  </span>
                  <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-amber-700">
                    {reviewCases.length}
                  </span>
                  <span className="text-xs text-surface-500">flagged / critical</span>
                </div>
              </Card>

              <Card className="p-5 border-surface-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Synthesized
                  </span>
                  <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-emerald-700">
                    {completedCases}
                  </span>
                  <span className="text-xs text-surface-500">audit reports ready</span>
                </div>
              </Card>
            </div>

            {/* Two-Column Operational Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Priority Attention Queue */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-surface-900 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <span>Investigations Requiring Adjuster Attention</span>
                    </h2>
                    <p className="text-xs text-surface-500">
                      Claims flagged with evidentiary discrepancies, high exposure, or pending supervisor review
                    </p>
                  </div>
                  <Link
                    href="/discrepancies"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors inline-flex items-center gap-1"
                  >
                    <span>View all discrepancies</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {reviewCases.length === 0 ? (
                  <div className="rounded-lg border border-surface-200 bg-surface-0 p-8 text-center space-y-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-surface-800">No Critical Flags Pending</h4>
                    <p className="text-xs text-surface-500 max-w-sm mx-auto">
                      All currently processed packages have mutually consistent records without escalated discrepancy flags.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewCases.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/cases/${item.id}`)}
                        className="group bg-surface-0 border border-surface-200 hover:border-brand-400 rounded-lg p-4 transition-all duration-150 cursor-pointer shadow-subtle hover:shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-800 border border-surface-200">
                              {item.case_number}
                            </span>
                            <Badge variant={getPriorityBadgeVariant(item.priority)} size="xs" dot>
                              {formatPriority(item.priority)} Priority
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(item.status)} size="xs">
                              {formatStatus(item.status)}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-surface-500">
                            {item.claimant_name && (
                              <span>Claimant: <strong className="text-surface-700">{item.claimant_name}</strong></span>
                            )}
                            {item.policy_number && (
                              <span className="font-mono">Policy: {item.policy_number}</span>
                            )}
                            <span>Files: {item.document_count}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>Open Workbench</span>
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Processing Status Breakdown */}
                <div className="rounded-lg border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">
                    Investigation Priority Distribution
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded bg-surface-50 border border-surface-200">
                      <span className="text-[11px] text-surface-500 block uppercase font-medium">Critical</span>
                      <span className="text-xl font-bold text-rose-700 mt-1 block">
                        {priorityDistribution.critical}
                      </span>
                    </div>
                    <div className="p-3 rounded bg-surface-50 border border-surface-200">
                      <span className="text-[11px] text-surface-500 block uppercase font-medium">High</span>
                      <span className="text-xl font-bold text-amber-700 mt-1 block">
                        {priorityDistribution.high}
                      </span>
                    </div>
                    <div className="p-3 rounded bg-surface-50 border border-surface-200">
                      <span className="text-[11px] text-surface-500 block uppercase font-medium">Medium</span>
                      <span className="text-xl font-bold text-surface-800 mt-1 block">
                        {priorityDistribution.medium}
                      </span>
                    </div>
                    <div className="p-3 rounded bg-surface-50 border border-surface-200">
                      <span className="text-[11px] text-surface-500 block uppercase font-medium">Low</span>
                      <span className="text-xl font-bold text-surface-600 mt-1 block">
                        {priorityDistribution.low}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Quick Actions & Recent Intake Feed */}
              <div className="space-y-6">
                {/* Quick Actions Panel */}
                <div className="rounded-lg border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">
                    Quick Operational Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => router.push('/cases/new')}
                      className="w-full flex items-center justify-between p-3 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-200 hover:border-brand-300 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlusCircle className="h-4 w-4 text-brand-600" />
                        <div>
                          <div className="text-xs font-bold text-surface-900 group-hover:text-brand-700">
                            Create New Case
                          </div>
                          <div className="text-[11px] text-surface-500">
                            Upload FNOL forms &amp; police reports
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-brand-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/demo')}
                      className="w-full flex items-center justify-between p-3 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-200 hover:border-brand-300 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <FlaskConical className="h-4 w-4 text-brand-600" />
                        <div>
                          <div className="text-xs font-bold text-surface-900 group-hover:text-brand-700">
                            Launch Demo Lab
                          </div>
                          <div className="text-[11px] text-surface-500">
                            1-click load of 5 evaluation packages
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-brand-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/engine')}
                      className="w-full flex items-center justify-between p-3 rounded-md bg-surface-50 hover:bg-brand-50 border border-surface-200 hover:border-brand-300 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Cpu className="h-4 w-4 text-brand-600" />
                        <div>
                          <div className="text-xs font-bold text-surface-900 group-hover:text-brand-700">
                            Inspect Agentic Graph
                          </div>
                          <div className="text-[11px] text-surface-500">
                            LangGraph state machine &amp; telemetry
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-brand-600" />
                    </button>
                  </div>
                </div>

                {/* Compact Recent Cases Feed */}
                <div className="rounded-lg border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">
                      Recent Activity Feed
                    </h3>
                    <Link
                      href="/cases"
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      All ({totalCases})
                    </Link>
                  </div>

                  {recentCases.length === 0 ? (
                    <p className="text-xs text-surface-400 italic py-2">No recent claims submitted.</p>
                  ) : (
                    <div className="divide-y divide-surface-100">
                      {recentCases.map((rc) => (
                        <Link
                          key={rc.id}
                          href={`/cases/${rc.id}`}
                          className="py-2.5 block group hover:bg-surface-50 px-2 rounded -mx-2 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-semibold text-surface-800 group-hover:text-brand-600">
                              {rc.case_number}
                            </span>
                            <span className="text-[11px] text-surface-400">
                              {formatDate(rc.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-surface-600 truncate mt-0.5">
                            {rc.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
