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
  Cpu,
  ShieldAlert,
  ChevronRight,
  FileText,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Button } from '@/components/ui/Button';
import { StarBorder } from '@/components/ui/StarBorder';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDate, formatPriority, formatStatus, getPriorityBadgeVariant, getStatusBadgeVariant } from '@/lib/utils';
import { CaseSummary } from '@/lib/types';
import { ThoughtLine } from '@/components/ui/ThoughtLine';

export default function DashboardPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();

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
      if (c.priority in priorityDist) {
        priorityDist[c.priority as keyof typeof priorityDist]++;
      }

      if (['open', 'new', 'processing', 'in_progress'].includes(c.status)) {
        active++;
      }

      if (['flagged', 'in_review'].includes(c.status) || ['critical', 'high'].includes(c.priority)) {
        reviewList.push(c);
      }

      if (['completed', 'investigation_complete', 'report_generated', 'closed'].includes(c.status)) {
        completed++;
      }
    });

    const sortedRecent = [...cases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return {
      activeCases: active,
      reviewCases: reviewList,
      completedCases: completed,
      recentCases: sortedRecent,
      priorityDistribution: priorityDist,
    };
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Sub-Header: Clean, Restrained, Executive */}
      <section className="border-b border-surface-200/80 bg-surface-0 dark:bg-[#0c1322] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0a1f44] dark:text-white">
              Claims Operations Cockpit
            </h1>
            <p className="text-xs text-surface-500">
              Portfolio intake, contradiction triage, and adjudication status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="h-3 w-3 text-surface-400" />}
            >
              Sync
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/demo')}
              leftIcon={<FlaskConical className="h-3 w-3 text-surface-500" />}
            >
              Demo Lab
            </Button>
            <StarBorder
              as="button"
              onClick={() => router.push('/cases/new')}
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
              className="!py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer inline-flex items-center"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>New Investigation</span>
            </StarBorder>
          </div>
        </div>
      </section>

      {/* Main Cockpit Body */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-surface-200/90 dark:border-surface-800 bg-surface-0/90 dark:bg-surface-900/60 shadow-xs flex justify-center">
              <ThoughtLine
                working={loading}
                steps={[
                  'Connecting to ClaimScope intelligence layer',
                  'Loading operational claims docket',
                  'Aggregating adjustor metrics & fraud triage queues',
                ]}
                label="Initializing Investigation Cockpit…"
                doneLabel="Cockpit ready in"
                fontSize={14}
                showTimer
                color="var(--color-brand-600, #2563eb)"
              />
            </div>
            <LoadingState variant="card-skeleton" count={3} />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Dashboard Data"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            {/* 1. Single Unified Operational Metrics Bar */}
            <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] p-4 sm:p-5 shadow-2xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-surface-100 dark:divide-surface-200/60">
                {/* Total Claims */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 block">
                    Total Ingested
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white">
                      {totalCases}
                    </span>
                    <span className="text-[11px] text-surface-500">claim files</span>
                  </div>
                </div>

                {/* Active Intake */}
                <div className="space-y-1 pt-3 md:pt-0 md:pl-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 block">
                    Active Pipeline
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                      {activeCases}
                    </span>
                    <span className="text-[11px] text-surface-500">in processing</span>
                  </div>
                </div>

                {/* Attention Required */}
                <div className="space-y-1 pt-3 md:pt-0 md:pl-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 block">
                    Attention Required
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                      {reviewCases.length}
                    </span>
                    <span className="text-[11px] text-surface-500">flagged / critical</span>
                  </div>
                </div>

                {/* Audit Ready */}
                <div className="space-y-1 pt-3 md:pt-0 md:pl-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 block">
                    Adjudicated Reports
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-growth-600 dark:text-growth-400">
                      {completedCases}
                    </span>
                    <span className="text-[11px] text-surface-500">ready for export</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Priority Attention Worklist (Table Format, Not Chunky Cards) */}
            <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] shadow-2xs overflow-hidden">
              <div className="p-4 sm:px-5 border-b border-surface-100 dark:border-surface-200/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                  <h2 className="text-sm font-bold tracking-tight text-surface-900 dark:text-white">
                    Investigations Requiring Adjuster Attention
                  </h2>
                  <span className="font-mono text-[10px] px-2 py-0.2 rounded-full bg-surface-100 dark:bg-surface-200/50 text-surface-600 font-semibold">
                    {reviewCases.length}
                  </span>
                </div>

                <Link
                  href="/discrepancies"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>Review all discrepancies</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {reviewCases.length === 0 ? (
                <div className="p-8 text-center text-xs text-surface-500 space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-growth-600 mx-auto" />
                  <p className="font-medium text-surface-800">No Critical Flags Pending</p>
                  <p className="text-surface-400">All submitted incident files have mutually consistent evidence.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-100 dark:divide-surface-200/40 text-left text-xs">
                    <thead className="bg-surface-50 dark:bg-surface-100/30 text-surface-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3">Case ID</th>
                        <th className="px-5 py-3">Incident Summary</th>
                        <th className="px-5 py-3">Claimant / Policy</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-200/30 font-normal">
                      {reviewCases.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => router.push(`/cases/${item.id}`)}
                          className="hover:bg-surface-50 dark:hover:bg-surface-100/20 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3 whitespace-nowrap font-mono font-semibold text-surface-900 dark:text-white group-hover:text-brand-600">
                            {item.case_number}
                          </td>
                          <td className="px-5 py-3 max-w-sm truncate font-medium text-surface-800 dark:text-surface-200">
                            {item.title}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-surface-600 dark:text-surface-400">
                            <div>{item.claimant_name || <span className="italic text-surface-400">—</span>}</div>
                            {item.policy_number && (
                              <div className="font-mono text-[10px] text-surface-400">{item.policy_number}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Badge variant={getPriorityBadgeVariant(item.priority)} size="xs" dot>
                              {formatPriority(item.priority)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(item.status)} size="xs">
                              {formatStatus(item.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                              Open Workbench <ChevronRight className="h-3 w-3" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Balanced Split Section: Recent Activity & Triage Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Cols: Recent Registry Activity Table */}
              <div className="lg:col-span-8 rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] shadow-2xs overflow-hidden">
                <div className="p-4 sm:px-5 border-b border-surface-100 dark:border-surface-200/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    Recent Activity Registry
                  </h3>
                  <Link
                    href="/cases"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    All Cases ({totalCases})
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-100 dark:divide-surface-200/40 text-left text-xs">
                    <thead className="bg-surface-50 dark:bg-surface-100/30 text-surface-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-2.5">Case ID</th>
                        <th className="px-5 py-2.5">Loss Description</th>
                        <th className="px-5 py-2.5">Files</th>
                        <th className="px-5 py-2.5">Status</th>
                        <th className="px-5 py-2.5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-200/30 font-normal">
                      {recentCases.map((rc) => (
                        <tr
                          key={rc.id}
                          onClick={() => router.push(`/cases/${rc.id}`)}
                          className="hover:bg-surface-50 dark:hover:bg-surface-100/20 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-2.5 whitespace-nowrap font-mono font-semibold text-surface-800 dark:text-surface-200 group-hover:text-brand-600">
                            {rc.case_number}
                          </td>
                          <td className="px-5 py-2.5 max-w-xs truncate text-surface-700 dark:text-surface-300">
                            {rc.title}
                          </td>
                          <td className="px-5 py-2.5 whitespace-nowrap text-surface-500 font-mono text-[11px]">
                            {rc.document_count} files
                          </td>
                          <td className="px-5 py-2.5 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(rc.status)} size="xs">
                              {formatStatus(rc.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-2.5 text-right whitespace-nowrap text-surface-400 text-[11px]">
                            {formatDate(rc.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 4 Cols: Clean Priority Breakdown & Operational Shortcuts */}
              <div className="lg:col-span-4 space-y-4">
                {/* Priority Matrix */}
                <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] p-4.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-200/60 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                      Portfolio Priority Tiers
                    </h3>
                    <span className="text-[11px] font-mono text-surface-400">{totalCases} Total</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-100/40 border border-surface-200">
                      <span className="text-[10px] uppercase font-bold text-surface-500 block">Critical</span>
                      <span className="text-xl font-extrabold text-surface-900 dark:text-white mt-0.5 block">
                        {priorityDistribution.critical}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-100/40 border border-surface-200">
                      <span className="text-[10px] uppercase font-bold text-surface-500 block">High</span>
                      <span className="text-xl font-extrabold text-surface-900 dark:text-white mt-0.5 block">
                        {priorityDistribution.high}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-100/40 border border-surface-200">
                      <span className="text-[10px] uppercase font-bold text-surface-500 block">Medium</span>
                      <span className="text-xl font-extrabold text-surface-900 dark:text-white mt-0.5 block">
                        {priorityDistribution.medium}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-100/40 border border-surface-200">
                      <span className="text-[10px] uppercase font-bold text-surface-500 block">Low</span>
                      <span className="text-xl font-extrabold text-surface-900 dark:text-white mt-0.5 block">
                        {priorityDistribution.low}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Operational Shortcuts */}
                <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] p-4.5 shadow-2xs space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300 border-b border-surface-100 dark:border-surface-200/60 pb-2">
                    Quick Workflows
                  </h3>
                  <div className="divide-y divide-surface-100 dark:divide-surface-200/40">
                    <Link
                      href="/cases/new"
                      className="py-2.5 flex items-center justify-between text-xs text-surface-700 dark:text-surface-200 hover:text-brand-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-3.5 w-3.5 text-brand-600" />
                        <span className="font-semibold">New Claim Registration</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/demo"
                      className="py-2.5 flex items-center justify-between text-xs text-surface-700 dark:text-surface-200 hover:text-brand-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-semibold">Demo Evaluation Scenarios</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/engine"
                      className="py-2.5 flex items-center justify-between text-xs text-surface-700 dark:text-surface-200 hover:text-brand-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3.5 w-3.5 text-brand-600" />
                        <span className="font-semibold">Agentic Graph Inspection</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
