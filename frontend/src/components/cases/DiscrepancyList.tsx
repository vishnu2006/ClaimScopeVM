'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRightLeft, Info } from 'lucide-react';
import { InconsistencyFinding } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface DiscrepancyListProps {
  inconsistencies: InconsistencyFinding[];
}

export function DiscrepancyList({ inconsistencies }: DiscrepancyListProps) {
  if (inconsistencies.length === 0) {
    return (
      <div className="rounded-lg border border-surface-200 bg-emerald-50/40 p-6 text-center space-y-2">
        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-emerald-900">
          No Cross-Document Discrepancies Detected
        </h4>
        <p className="text-xs text-emerald-700 max-w-md mx-auto">
          All analyzed facts (incident timing, vehicle identification, narrative sequence, and physical damage) are consistent across available package documents.
        </p>
      </div>
    );
  }

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-surface-900">
            Cross-Document Evidentiary Discrepancies ({inconsistencies.length})
          </h3>
          <p className="text-xs text-surface-500">
            Contradictions detected between policyholder statements, official police reports, estimates, and photographic observations
          </p>
        </div>
      </div>

      {/* Human-in-the-loop regulatory guardrail notice */}
      <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <span>
          <strong>Adjuster Review Advisory:</strong> Evidentiary discrepancies reflect conflicting statements or mismatched records across documents.
          They assist human adjuster inquiry and do <em>not</em> constitute legal determinations, coverage denials, or accusations of fraud.
        </span>
      </div>

      <div className="space-y-3">
        {inconsistencies.map((disc) => (
          <Card key={disc.discrepancy_id} className="border-surface-200">
            <CardHeader className="pb-2.5 border-b border-surface-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-rose-50 text-status-error">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-surface-900 capitalize">
                      {disc.category.replace('_', ' ')}: {disc.field_name.replace('_', ' ')}
                    </CardTitle>
                    <span className="text-[10px] font-mono text-surface-400">Ref: {disc.discrepancy_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityBadgeVariant(disc.severity)} size="sm">
                    {disc.severity.toUpperCase()} PRIORITY
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3 text-xs">
              <p className="text-surface-700 font-medium leading-relaxed">
                {disc.explanation}
              </p>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md bg-surface-50 p-3 border border-surface-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider block">
                    Source A Observation:
                  </span>
                  <div className="bg-surface-0 rounded p-2 border border-surface-200 text-surface-800 font-mono text-[11px]">
                    {disc.source_a}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider block">
                    Source B Observation:
                  </span>
                  <div className="bg-surface-0 rounded p-2 border border-surface-200 text-surface-800 font-mono text-[11px]">
                    {disc.source_b}
                  </div>
                </div>
              </div>

              {disc.investigation_notes && (
                <div className="text-[11px] text-surface-600 bg-brand-50/50 rounded p-2 border border-brand-100 flex items-start gap-2">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-brand-900">Suggested Adjuster Follow-Up:</strong> {disc.investigation_notes}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
