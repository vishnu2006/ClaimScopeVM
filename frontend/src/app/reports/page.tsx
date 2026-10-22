'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Printer,
  Info,
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
import { formatDate, formatDateTime } from '@/lib/utils';

interface CaseReportSummary {
  case_id: string;
  case_number: string;
  case_title: string;
  claimant_name: string | null;
  policy_number: string | null;
  report: Report | null;
}

export default function InvestigationReportsPage() {
  const router = useRouter();
  const { cases, loading: casesLoading } = useCases();

  const [caseReports, setCaseReports] = useState<CaseReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reports for cases
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

    const activeSample = cases.slice(0, 12);

    Promise.allSettled(
      activeSample.map(async (c) => {
        try {
          const detail = await api.getCase(c.id);
          return {
            case_id: c.id,
            case_number: c.case_number,
            case_title: c.title,
            claimant_name: c.claimant_name,
            policy_number: c.policy_number,
            report: detail.report || null,
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

  const filteredReports = caseReports.filter((cr) => {
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

  const getOutcomeBadge = (outcome?: string) => {
    if (!outcome) {
      return (
        <Badge variant="neutral" size="xs">
          PENDING
        </Badge>
      );
    }
    if (outcome === 'ROUTINE_REVIEW' || outcome === 'routine') {
      return (
        <Badge variant="success" size="xs" dot>
          ROUTINE REVIEW
        </Badge>
      );
    }
    if (outcome === 'ADDITIONAL_INFORMATION_REQUIRED' || outcome === 'flag_for_review') {
      return (
        <Badge variant="warning" size="xs" dot>
          ADDITIONAL INFO REQUIRED
        </Badge>
      );
    }
    if (outcome === 'ESCALATE_FOR_HUMAN_REVIEW' || outcome === 'escalate') {
      return (
        <Badge variant="error" size="xs" dot>
          ESCALATE FOR HUMAN REVIEW
        </Badge>
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
        title="Investigation Reports Archive"
        subtitle="Synthesized findings, adjuster action recommendations, and institutional PDF exports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investigation Reports' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-0 border border-surface-200 rounded-lg p-3 shadow-subtle">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search reports by case # or claimant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs h-8.5"
            />
          </div>

          <div className="text-xs text-surface-500 font-medium">
            Total Cases: <strong className="text-surface-900">{caseReports.length}</strong> • Reports Generated:{' '}
            <strong className="text-surface-900">
              {caseReports.filter((c) => c.report !== null).length}
            </strong>
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
          <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-card">
            <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
              <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Case ID</th>
                  <th className="px-4 py-3.5">Incident Title</th>
                  <th className="px-4 py-3.5">Claimant / Policy</th>
                  <th className="px-4 py-3.5">Assessment Recommendation</th>
                  <th className="px-4 py-3.5">Report Status</th>
                  <th className="px-4 py-3.5">Generated</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-normal">
                {filteredReports.map((cr) => {
                  const hasReport = !!cr.report;
                  const outcome = cr.report?.outcome || cr.report?.recommendation;

                  return (
                    <tr
                      key={cr.case_id}
                      onClick={() => router.push(`/cases/${cr.case_id}`)}
                      className="hover:bg-surface-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-800 border border-surface-200 group-hover:border-brand-300 transition-colors">
                          {cr.case_number}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate">
                          {cr.case_title}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-surface-700">
                        <div>{cr.claimant_name || <span className="text-surface-400 italic">Unassigned</span>}</div>
                        {cr.policy_number && (
                          <div className="font-mono text-[11px] text-surface-400">{cr.policy_number}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {hasReport ? getOutcomeBadge(outcome) : (
                          <span className="text-surface-400 italic text-[11px]">Awaiting Investigation</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {hasReport ? (
                          <Badge variant="success" size="xs">
                            Generated
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="xs">
                            Not Generated
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-surface-500 text-[11px]">
                        {cr.report?.generated_at ? formatDateTime(cr.report.generated_at) : '—'}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {hasReport ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={(e) => handleDownloadPdf(cr.case_id, cr.case_number, e)}
                              loading={downloadingId === cr.case_id}
                              leftIcon={<Download className="h-3 w-3" />}
                            >
                              PDF
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
