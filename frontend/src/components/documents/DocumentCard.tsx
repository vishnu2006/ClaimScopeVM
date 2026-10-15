'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Play,
  Eye,
  Trash2,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { Document } from '@/lib/types';
import { formatDate, formatDocumentType, formatFileSize } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProcessingStatus } from './ProcessingStatus';
import { Modal } from '@/components/ui/Modal';

export interface DocumentCardProps {
  document: Document;
  onProcess?: (docId: string) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onProcess,
  onDelete,
}) => {
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const getFileIcon = () => {
    const filename = document.original_filename.toLowerCase();
    const type = document.file_type.toLowerCase();

    if (type.includes('pdf') || filename.endsWith('.pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    if (
      type.includes('image') ||
      filename.endsWith('.jpg') ||
      filename.endsWith('.jpeg') ||
      filename.endsWith('.png')
    ) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    }
    if (filename.endsWith('.csv') || filename.endsWith('.xlsx')) {
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    }
    return <File className="h-6 w-6 text-surface-500" />;
  };

  const handleProcess = async () => {
    if (!onProcess) return;
    setProcessing(true);
    try {
      await onProcess(document.id);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setDeleting(false);
    }
  };

  const hasExtractedData =
    Boolean(document.extracted_text) ||
    (document.extraction_metadata && Object.keys(document.extraction_metadata).length > 0);

  return (
    <>
      <div className="flex flex-col justify-between rounded-lg border border-surface-200 bg-surface-0 p-4 shadow-card hover:border-surface-300 transition-all">
        <div>
          {/* Top row: Icon + Filename + Status */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-50 border border-surface-200">
                {getFileIcon()}
              </div>
              <div className="min-w-0">
                <h4
                  className="text-xs font-semibold text-surface-900 truncate"
                  title={document.original_filename}
                >
                  {document.original_filename}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="brand" size="sm">
                    {formatDocumentType(document.document_type)}
                  </Badge>
                  <span className="text-[11px] text-surface-400 flex items-center gap-1 font-mono">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(document.file_size)}
                  </span>
                </div>
              </div>
            </div>

            <ProcessingStatus
              status={document.processing_status}
              errorMessage={document.processing_error}
            />
          </div>
        </div>

        {/* Footer: Date + Actions */}
        <div className="flex items-center justify-between border-t border-surface-100 pt-3 mt-3 text-xs">
          <span className="text-[11px] text-surface-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(document.created_at)}
          </span>

          <div className="flex items-center gap-1.5">
            {hasExtractedData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewModalOpen(true)}
                title="View Extracted Content"
                leftIcon={<Eye className="h-3.5 w-3.5" />}
              >
                Inspect
              </Button>
            )}

            {(document.processing_status === 'pending' ||
              document.processing_status === 'failed') &&
              onProcess && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleProcess}
                  loading={processing}
                  leftIcon={<Play className="h-3.5 w-3.5 text-brand-600" />}
                >
                  Process
                </Button>
              )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                className="text-surface-400 hover:text-status-error hover:bg-rose-50"
                title="Delete Document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Text Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Extracted Content: ${document.original_filename}`}
        description={`Document type: ${formatDocumentType(document.document_type)}`}
        maxWidth="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {document.extracted_text && (
            <div>
              <h5 className="text-xs font-semibold uppercase text-surface-600 mb-2">
                Raw Extracted OCR / Free Text
              </h5>
              <div className="rounded-md bg-surface-900 text-surface-100 p-3 font-mono text-xs max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {document.extracted_text}
              </div>
            </div>
          )}

          {document.extraction_metadata && (
            <div>
              <h5 className="text-xs font-semibold uppercase text-surface-600 mb-2">
                Structured Extraction Metadata
              </h5>
              <pre className="rounded-md bg-surface-100 border border-surface-200 p-3 font-mono text-xs max-h-64 overflow-y-auto text-surface-800">
                {JSON.stringify(document.extraction_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
