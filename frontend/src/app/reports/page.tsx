'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Download,
  AlertTriangle,
  Calendar,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { Report } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

interface CaseReportSummary {
  case_id: string;
  case_number: string;
  case_title: string;
  claimant_name: string | null;
  policy_number: string | null;
  status: string;
  report: Report | null;
  discrepancies_count: number;
  extracted_outcome: string | null;
  rationale: string | null;
}

export default function InvestigationReportsPage() {
  const router = useRouter();
  const { cases, loading: casesLoading } = useCases();

  const [caseReports, setCaseReports] = useState<CaseReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'ESCALATE' | 'ADDITIONAL_INFO' | 'ROUTINE'>('ALL');

  // Fetch full case reports
  useEffect(() => {
    let mounted = true;
    if (!cases || cases.length === 0) {
      if (!casesLoading) {
        Promise.resolve().then(() => {
          if (mounted) setLoading(false);
        });
      }
      return;
    }

    Promise.resolve().then(() => {
      if (mounted) setLoading(true);
    });

    Promise.allSettled(
      cases.map(async (c) => {
        try {
          const detail = await api.getCase(c.id);
          const rep = detail.report || null;
          
          let extractedOutcome: string | null = null;
          let discrepanciesCount = 0;
          let rationale: string | null = null;

          if (rep) {
            const rd = (rep as any).report_data || {};
            const gen = rd.generated_report || {};
            const ass = rd.assessment || {};
            const findings = (rep as any).findings || {};

            extractedOutcome =
              gen.outcome ||
              gen.recommendation ||
              (typeof ass === 'object' ? ass.outcome : null) ||
              rep.outcome ||
              rep.recommendation ||
              null;

            discrepanciesCount =
              gen.discrepancies_count ??
              (Array.isArray(findings.discrepancies) ? findings.discrepancies.length : 0);

            rationale = gen.recommendation_rationale || (typeof ass === 'object' ? ass.rationale : null) || rep.summary || null;
          }

          return {
            case_id: c.id,
            case_number: c.case_number,
            case_title: c.title,
            claimant_name: c.claimant_name,
            policy_number: c.policy_number,
            status: c.status,
            report: rep,
            discrepancies_count: discrepanciesCount,
            extracted_outcome: extractedOutcome,
            rationale: rationale,
          } as CaseReportSummary;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!mounted) return;
      const valid: CaseReportSummary[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          valid.push(r.value);
        }
      });
      setCaseReports(valid);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [cases, casesLoading]);

  const handleDownloadPdf = async (caseId: string, caseNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(caseId);
    try {
      const blob = await api.downloadReportPdf(caseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClaimScope_Report_${caseNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    return caseReports.filter((cr) => {
      // Outcome Filter
      if (outcomeFilter !== 'ALL') {
        const out = (cr.extracted_outcome || '').toUpperCase();
        if (outcomeFilter === 'ESCALATE' && !out.includes('ESCALAT')) return false;
        if (outcomeFilter === 'ADDITIONAL_INFO' && !out.includes('ADDITIONAL') && !out.includes('FLAG')) return false;
        if (outcomeFilter === 'ROUTINE' && !out.includes('ROUTINE')) return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          cr.case_number.toLowerCase().includes(q) ||
          cr.case_title.toLowerCase().includes(q) ||
          (cr.claimant_name && cr.claimant_name.toLowerCase().includes(q)) ||
          (cr.policy_number && cr.policy_number.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [caseReports, searchTerm, outcomeFilter]);

  const stats = useMemo(() => {
    const total = caseReports.length;
    const generated = caseReports.filter((c) => c.report !== null).length;
    const escalated = caseReports.filter((c) => (c.extracted_outcome || '').toUpperCase().includes('ESCALAT')).length;
    const routine = caseReports.filter((c) => (c.extracted_outcome || '').toUpperCase().includes('ROUTINE')).length;
    return { total, generated, escalated, routine };
  }, [caseReports]);

  const getOutcomeBadge = (outcome?: string | null) => {
    if (!outcome) {
      return (
        <Badge variant="neutral" size="xs">
          PENDING
        </Badge>
      );
    }
    const upper = outcome.toUpperCase();
    if (upper.includes('ROUTINE')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-growth-50 text-growth-700 border border-growth-200 dark:bg-growth-900/30 dark:text-growth-300 dark:border-growth-800">
          <span className="w-1.5 h-1.5 rounded-full bg-growth-500 animate-pulse" />
          ROUTINE REVIEW
        </span>
      );
    }
    if (upper.includes('ADDITIONAL') || upper.includes('FLAG')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          ADDITIONAL INFO REQUIRED
        </span>
      );
    }
    if (upper.includes('ESCALAT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          ESCALATE FOR HUMAN REVIEW
        </span>
      );
    }
    return (
      <Badge variant="info" size="xs">
        {outcome}
      </Badge>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Investigation Dossiers &amp; Reports"
        subtitle="Auditable decision-support dossiers, cross-document discrepancy analyses, and institutional PDF exports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investigation Reports' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-surface-500 text-xs font-semibold mb-1">
              <span>Total Tracked Cases</span>
              <FileText className="h-4 w-4 text-surface-400" />
            </div>
            <div className="text-2xl font-black text-surface-900 dark:text-white">{stats.total}</div>
            <div className="text-[11px] text-surface-400 mt-1">Across all active claims</div>
          </div>

          <div className="bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-surface-500 text-xs font-semibold mb-1">
              <span>Reports Generated</span>
              <FileCheck2 className="h-4 w-4 text-brand-500" />
            </div>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">{stats.generated}</div>
            <div className="text-[11px] text-surface-400 mt-1">Ready for PDF download</div>
          </div>

          <div className="bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-surface-500 text-xs font-semibold mb-1">
              <span>Human Escalation</span>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.escalated}</div>
            <div className="text-[11px] text-surface-400 mt-1">Critical discrepancies flagged</div>
          </div>

          <div className="bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-surface-500 text-xs font-semibold mb-1">
              <span>Routine Review</span>
              <CheckCircle2 className="h-4 w-4 text-growth-500" />
            </div>
            <div className="text-2xl font-black text-growth-600 dark:text-growth-400">{stats.routine}</div>
            <div className="text-[11px] text-surface-400 mt-1">Mutually consistent records</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search dossiers by case #, claimant, policy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="text-xs h-9 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => setOutcomeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  outcomeFilter === 'ALL'
                    ? 'bg-brand-500 text-white shadow-2xs'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 hover:text-surface-900'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setOutcomeFilter('ESCALATE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  outcomeFilter === 'ESCALATE'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 hover:text-surface-900'
                }`}
              >
                Escalate ({stats.escalated})
              </button>
              <button
                type="button"
                onClick={() => setOutcomeFilter('ROUTINE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  outcomeFilter === 'ROUTINE'
                    ? 'bg-growth-600 text-white shadow-2xs'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 hover:text-surface-900'
                }`}
              >
                Routine ({stats.routine})
              </button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading || casesLoading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={4} />
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No investigation reports found"
            description="Run an investigation on a claim case to compile synthesized findings and PDF exports."
            actionLabel="View All Cases"
            onAction={() => router.push('/cases')}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-[#0f172a] shadow-card">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-800 text-left text-xs">
              <thead className="bg-surface-50 dark:bg-surface-900/60 text-surface-600 dark:text-surface-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Claim Case</th>
                  <th className="px-5 py-4">Claimant &amp; Policy</th>
                  <th className="px-5 py-4">Adjudication Outcome</th>
                  <th className="px-5 py-4 text-center">Contradictions</th>
                  <th className="px-5 py-4">Audit Dossier</th>
                  <th className="px-5 py-4 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 font-normal">
                {filteredReports.map((cr) => {
                  const hasReport = !!cr.report;
                  const outcome = cr.extracted_outcome;

                  return (
                    <tr
                      key={cr.case_id}
                      onClick={() => router.push(`/cases/${cr.case_id}`)}
                      className="hover:bg-surface-50/80 dark:hover:bg-surface-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-700 group-hover:border-brand-400 transition-colors">
                            {cr.case_number}
                          </span>
                        </div>
                        <div className="font-semibold text-surface-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {cr.case_title}
                        </div>
                        {cr.rationale && (
                          <p className="text-[11px] text-surface-500 line-clamp-1 max-w-md mt-0.5">
                            {cr.rationale}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-surface-700 dark:text-surface-300">
                        <div className="font-medium">{cr.claimant_name || <span className="text-surface-400 italic">Unassigned</span>}</div>
                        {cr.policy_number && (
                          <div className="font-mono text-[11px] text-surface-400 mt-0.5">{cr.policy_number}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasReport ? getOutcomeBadge(outcome) : (
                          <span className="text-surface-400 italic text-[11px]">Awaiting Investigation</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {hasReport ? (
                          cr.discrepancies_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              {cr.discrepancies_count} Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-growth-100 text-growth-800 dark:bg-growth-950 dark:text-growth-300">
                              0 Clean
                            </span>
                          )
                        ) : (
                          <span className="text-surface-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasReport ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-growth-600 dark:text-growth-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Compiled &amp; Verified
                            </span>
                            <span className="text-[10px] text-surface-400">
                              {cr.report?.generated_at ? formatDateTime(cr.report.generated_at) : 'Active'}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="neutral" size="xs">
                            Not Generated
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {hasReport ? (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={(e) => handleDownloadPdf(cr.case_id, cr.case_number, e)}
                              loading={downloadingId === cr.case_id}
                              leftIcon={<Download className="h-3.5 w-3.5" />}
                              className="font-semibold shadow-2xs"
                            >
                              Download PDF
                            </Button>
                          ) : (
                            <Link href={`/cases/${cr.case_id}`}>
                              <Button variant="outline" size="xs">
                                Run Intake
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
