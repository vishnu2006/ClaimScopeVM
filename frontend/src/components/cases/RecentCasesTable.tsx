'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { CaseSummary } from '@/lib/types';
import {
  formatDate,
  formatPriority,
  formatStatus,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface RecentCasesTableProps {
  cases: CaseSummary[];
  onRowClick?: (caseId: string) => void;
}

export const RecentCasesTable: React.FC<RecentCasesTableProps> = ({ cases }) => {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-card">
      <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
        <thead className="bg-surface-50/80 text-surface-500 font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th className="px-4 py-3">Case ID</th>
            <th className="px-4 py-3">Incident Description</th>
            <th className="px-4 py-3">Claimant</th>
            <th className="px-4 py-3">Policy Number</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Files</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 font-normal">
          {cases.map((c) => {
            const priorityVariant = getPriorityBadgeVariant(c.priority);
            const statusVariant = getStatusBadgeVariant(c.status);

            return (
              <tr
                key={c.id}
                onClick={() => router.push(`/cases/${c.id}`)}
                className="group hover:bg-surface-50/80 transition-colors cursor-pointer"
              >
                {/* Case Number */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-800 border border-surface-200 group-hover:border-surface-300 transition-colors">
                    {c.case_number}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate">
                    {c.title}
                  </div>
                </td>

                {/* Claimant */}
                <td className="px-4 py-3 whitespace-nowrap text-surface-700">
                  {c.claimant_name ? (
                    <span className="font-medium text-surface-800">{c.claimant_name}</span>
                  ) : (
                    <span className="text-surface-400 italic">Unassigned</span>
                  )}
                </td>

                {/* Policy */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {c.policy_number ? (
                    <span className="font-mono text-[11px] text-surface-600 bg-surface-50 px-1.5 py-0.5 rounded border border-surface-200">
                      {c.policy_number}
                    </span>
                  ) : (
                    <span className="text-surface-400 italic text-[11px]">None</span>
                  )}
                </td>

                {/* Priority */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={priorityVariant} size="xs" dot>
                    {formatPriority(c.priority)}
                  </Badge>
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={statusVariant} size="xs" dot>
                    {formatStatus(c.status)}
                  </Badge>
                </td>

                {/* Documents */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-surface-600 bg-surface-100 px-2 py-0.5 rounded">
                    <FileText className="h-3 w-3 text-surface-400" />
                    <span>{c.document_count}</span>
                  </span>
                </td>

                {/* Created Date */}
                <td className="px-4 py-3 whitespace-nowrap text-surface-500 text-[11px]">
                  {formatDate(c.created_at)}
                </td>

                {/* Action Link */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <Link
                    href={`/cases/${c.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-500 group-hover:text-brand-600 transition-colors"
                  >
                    <span>Workbench</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
