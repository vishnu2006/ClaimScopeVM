'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitCompare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { InconsistencyFinding } from '@/lib/types';

interface DiscrepancyWithCase extends InconsistencyFinding {
  case_id: string;
  case_number: string;
  case_title: string;
}

export default function DiscrepancyReviewPage() {
  const router = useRouter();
  const { cases, loading: casesLoading } = useCases();

  const [discrepancies, setDiscrepancies] = useState<DiscrepancyWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

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
          const state = await api.getInvestigation(c.id);
          if (state && state.inconsistencies && state.inconsistencies.length > 0) {
            return state.inconsistencies.map((disc) => ({
              ...disc,
              case_id: c.id,
              case_number: c.case_number,
              case_title: c.title,
            }));
          }
          return [] as DiscrepancyWithCase[];
        } catch {
          return [] as DiscrepancyWithCase[];
        }
      })
    ).then((results) => {
      if (!mounted) return;
      const combined: DiscrepancyWithCase[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          combined.push(...res.value);
        }
      });
      setDiscrepancies(combined);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [cases, casesLoading]);

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (severityFilter === 'all') return true;
    return d.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Cross-Document Discrepancy Review"
        subtitle="Evidentiary contradictions detected across policyholder statements, police reports, and damage photos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Discrepancy Review' },
        ]}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Regulatory Guardrail Notice */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-xs text-amber-950 leading-relaxed shadow-subtle">
          <Info className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <strong className="block text-amber-900 font-semibold mb-0.5">
              Human-in-the-Loop Regulatory Notice
            </strong>
            <span>
              Evidentiary discrepancies reflect documented mismatches or conflicting narratives across submitted incident files.
              They are surfaced to assist licensed claims adjusters and SIU specialists in inquiry planning.
              ClaimScope does not independently accuse any party of fraud or unilaterally deny insurance coverage.
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-surface-0 border border-surface-200 rounded-lg p-3 shadow-subtle">
          <div className="text-xs text-surface-600 font-medium">
            Showing <strong className="text-surface-900">{filteredDiscrepancies.length}</strong> of{' '}
            <strong className="text-surface-900">{discrepancies.length}</strong> detected conflicts
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-surface-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Content Stream */}
        {loading || casesLoading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={3} />
          </div>
        ) : filteredDiscrepancies.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Cross-Document Discrepancies Located"
            description="All analyzed claim packages either have consistent facts or have not yet executed cross-document reasoning."
            actionLabel="View All Cases"
            onAction={() => router.push('/cases')}
          />
        ) : (
          <div className="space-y-4">
            {filteredDiscrepancies.map((disc, idx) => (
              <div
                key={`${disc.case_id}-${disc.discrepancy_id || idx}`}
                className="bg-surface-0 border border-surface-200 rounded-lg p-5 shadow-card space-y-4 hover:border-surface-300 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-100 text-surface-800 border border-surface-200">
                      {disc.case_number}
                    </span>
                    <h3 className="text-sm font-bold text-surface-900 capitalize">
                      {disc.category.replace(/_/g, ' ')}: {disc.field_name.replace(/_/g, ' ')}
                    </h3>
                    <Badge
                      variant={
                        ['critical', 'high'].includes(disc.severity.toLowerCase())
                          ? 'error'
                          : 'warning'
                      }
                      size="xs"
                      dot
                    >
                      {disc.severity.toUpperCase()} PRIORITY
                    </Badge>
                  </div>

                  <Link href={`/cases/${disc.case_id}`}>
                    <Button variant="secondary" size="xs" rightIcon={<ChevronRight className="h-3 w-3" />}>
                      Open Case
                    </Button>
                  </Link>
                </div>

                {/* Explanation */}
                <p className="text-xs sm:text-sm text-surface-800 font-medium leading-relaxed">
                  {disc.explanation}
                </p>

                {/* Side-by-Side Diff Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg bg-surface-50 p-4 border border-surface-200 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                      Source A Record:
                    </span>
                    <div className="bg-surface-0 rounded p-2.5 border border-surface-200 text-surface-800 font-mono text-xs leading-relaxed">
                      {disc.source_a}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                      Source B Record:
                    </span>
                    <div className="bg-surface-0 rounded p-2.5 border border-surface-200 text-surface-800 font-mono text-xs leading-relaxed">
                      {disc.source_b}
                    </div>
                  </div>
                </div>

                {/* Follow-up advisory */}
                {disc.investigation_notes && (
                  <div className="text-xs text-brand-900 bg-brand-50/70 rounded p-3 border border-brand-200/80 flex items-start gap-2">
                    <span className="font-semibold shrink-0">Adjuster Action Item:</span>
                    <span className="text-surface-700">{disc.investigation_notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
