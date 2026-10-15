import React from 'react';
import Link from 'next/link';
import { FileText, Calendar, User, ShieldAlert } from 'lucide-react';
import { CaseSummary } from '@/lib/types';
import {
  formatDate,
  formatPriority,
  formatStatus,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface CaseCardProps {
  caseItem: CaseSummary;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
    >
      <Card
        hover
        className="h-full flex flex-col justify-between transition-all duration-150 group-hover:border-brand-300"
      >
        <div className="p-5 pb-3">
          {/* Top row: Case Number & Badges */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
              {caseItem.case_number}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                {formatStatus(caseItem.status)}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(caseItem.priority)}>
                {formatPriority(caseItem.priority)}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-surface-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-2">
            {caseItem.title}
          </h3>

          {/* Claimant & Policy Info */}
          <div className="space-y-1.5 text-xs text-surface-500">
            {caseItem.claimant_name && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                <span className="truncate">Claimant: {caseItem.claimant_name}</span>
              </div>
            )}
            {caseItem.policy_number && (
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                <span className="truncate font-mono">Policy: {caseItem.policy_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Documents Count & Created Date */}
        <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3 text-[11px] text-surface-500 bg-surface-50/50 rounded-b-lg">
          <div className="flex items-center gap-1.5 font-medium">
            <FileText className="h-3.5 w-3.5 text-surface-400" />
            <span>
              {caseItem.document_count} {caseItem.document_count === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-surface-400" />
            <span>{formatDate(caseItem.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
