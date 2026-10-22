'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Calendar,
  ShieldCheck,
  User,
  ArrowLeft,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { CaseDetail } from '@/lib/types';
import {
  formatDate,
  formatDateTime,
  formatPriority,
  formatStatus,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarBorder } from '@/components/ui/StarBorder';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

export interface CaseHeaderProps {
  caseData: CaseDetail;
  onDeleted?: () => void;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  caseData,
  onDeleted,
  onDownloadPdf,
  isDownloadingPdf,
}) => {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteCase(caseData.id);
      setDeleteModalOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/cases');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete case';
      setDeleteError(msg);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border-b border-surface-200 bg-surface-0 px-4 sm:px-6 lg:px-8 py-3.5 shadow-subtle">
        <div className="max-w-[1440px] mx-auto space-y-3">
          {/* Top Row: Back button, Case Number, Status, Priority, and Primary Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => router.push('/cases')}
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                className="text-surface-500 hover:text-surface-900"
              >
                Cases
              </Button>
              <span className="text-surface-300">/</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-100 text-surface-800 border border-surface-200">
                {caseData.case_number}
              </span>
              <Badge variant={getStatusBadgeVariant(caseData.status)} size="xs" dot>
                {formatStatus(caseData.status)}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(caseData.priority)} size="xs" dot>
                {formatPriority(caseData.priority)} Priority
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {caseData.report && onDownloadPdf && (
                <StarBorder
                  as="button"
                  onClick={onDownloadPdf}
                  disabled={isDownloadingPdf}
                  color="#086afc"
                  trailColor="#5eba46"
                  duration={3.5}
                  thickness={1.5}
                  radius={6}
                  glow={0.6}
                  hover="lap"
                  backgroundColor="#ffffff"
                  textColor="#086afc"
                  borderColor="rgba(8, 106, 252, 0.3)"
                  className="!py-1 !px-2.5 !text-[11px] !font-bold border border-surface-200 shadow-2xs transition-transform active:scale-95 cursor-pointer inline-flex items-center dark:!bg-[#121c2e] dark:!text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span>{isDownloadingPdf ? 'Exporting...' : 'PDF Report'}</span>
                </StarBorder>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteModalOpen(true)}
                className="text-surface-400 hover:text-status-error hover:bg-rose-50"
                title="Delete Case"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Title & Metadata Strip */}
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 pt-1 border-t border-surface-100">
            <div className="space-y-0.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-surface-900 leading-snug">
                {caseData.title}
              </h1>
              {caseData.description && (
                <p className="text-xs text-surface-500 line-clamp-1 max-w-3xl">
                  {caseData.description}
                </p>
              )}
            </div>

            {/* Compact Metadata Chips */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-surface-600 font-medium">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-surface-400" />
                <span className="text-surface-500">Claimant:</span>
                <span className="text-surface-900 font-semibold">
                  {caseData.claimant_name || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-surface-400" />
                <span className="text-surface-500">Policy:</span>
                <span className="font-mono text-surface-800">
                  {caseData.policy_number || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-surface-400" />
                <span className="text-surface-500">Incident:</span>
                <span className="text-surface-800">{formatDate(caseData.incident_date)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-surface-400">
                <Clock className="h-3 w-3" />
                <span>{formatDateTime(caseData.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Delete Investigation Case"
        description="Are you sure you want to permanently delete this case? All uploaded documents, extracted facts, and generated reports will be removed."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        {deleteError && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium mb-3">
            {deleteError}
          </div>
        )}
        <p className="text-xs text-surface-600">
          Case: <strong className="font-mono text-surface-900">{caseData.case_number}</strong> — {caseData.title}
        </p>
      </Modal>
    </>
  );
};
