'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Calendar, ShieldCheck, User, ArrowLeft, Clock, Download } from 'lucide-react';
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
      <div className="border-b border-surface-200 bg-surface-0 px-6 py-5 shadow-subtle">
        {/* Navigation & Case Number */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/cases')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              All Cases
            </Button>
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-surface-100 text-surface-800 border border-surface-200">
              {caseData.case_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(caseData.status)} size="md">
              {formatStatus(caseData.status)}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(caseData.priority)} size="md">
              {formatPriority(caseData.priority)} Priority
            </Badge>
            {caseData.report && onDownloadPdf && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownloadPdf}
                loading={isDownloadingPdf}
                leftIcon={<Download className="h-4 w-4" />}
                className="ml-1"
              >
                PDF Report
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="text-surface-500 hover:text-status-error hover:bg-rose-50 ml-2"
              title="Delete Case"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-900 mb-3">
          {caseData.title}
        </h1>

        {caseData.description && (
          <p className="text-sm text-surface-600 mb-4 max-w-3xl leading-relaxed">
            {caseData.description}
          </p>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-surface-100 text-xs">
          <div>
            <span className="text-surface-400 block mb-0.5 font-medium">Claimant</span>
            <div className="flex items-center gap-1.5 font-semibold text-surface-800 truncate">
              <User className="h-3.5 w-3.5 text-surface-400 shrink-0" />
              <span>{caseData.claimant_name || 'Not specified'}</span>
            </div>
          </div>

          <div>
            <span className="text-surface-400 block mb-0.5 font-medium">Policy Number</span>
            <div className="flex items-center gap-1.5 font-semibold text-surface-800 font-mono truncate">
              <ShieldCheck className="h-3.5 w-3.5 text-surface-400 shrink-0" />
              <span>{caseData.policy_number || 'Not provided'}</span>
            </div>
          </div>

          <div>
            <span className="text-surface-400 block mb-0.5 font-medium">Incident Date</span>
            <div className="flex items-center gap-1.5 font-semibold text-surface-800">
              <Calendar className="h-3.5 w-3.5 text-surface-400 shrink-0" />
              <span>{formatDate(caseData.incident_date)}</span>
            </div>
          </div>

          <div>
            <span className="text-surface-400 block mb-0.5 font-medium">Created</span>
            <div className="flex items-center gap-1.5 text-surface-600">
              <Clock className="h-3.5 w-3.5 text-surface-400 shrink-0" />
              <span>{formatDateTime(caseData.created_at)}</span>
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
