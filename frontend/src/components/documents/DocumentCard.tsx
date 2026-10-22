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
  ExternalLink,
  Download,
} from 'lucide-react';
import { Document } from '@/lib/types';
import { formatDate, formatDocumentType, formatFileSize } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProcessingStatus } from './ProcessingStatus';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'ocr'>('preview');

  const filename = (document.original_filename || document.filename || '').toLowerCase();
  const type = (document.file_type || document.mime_type || '').toLowerCase();
  const isPdf = type.includes('pdf') || filename.endsWith('.pdf');
  const isImage =
    type.includes('image') ||
    filename.endsWith('.jpg') ||
    filename.endsWith('.jpeg') ||
    filename.endsWith('.png') ||
    filename.endsWith('.webp');

  const fileUrl = document.case_id ? api.getDocumentRawUrl(document.case_id, document.id) : '';

  const getFileIcon = () => {
    if (isPdf) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    if (isImage) {
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
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-50 border border-surface-200 hover:border-brand-400 hover:bg-brand-50/50 transition-colors cursor-pointer group"
                title="Click to view file"
              >
                {getFileIcon()}
              </button>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="text-left text-xs font-semibold text-surface-900 truncate hover:text-brand-600 transition-colors cursor-pointer block max-w-full"
                  title={document.original_filename}
                >
                  {document.original_filename}
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="brand" size="sm">
                    {formatDocumentType(document.document_type)}
                  </Badge>
                  <span className="text-[11px] text-surface-400 flex items-center gap-1 font-mono">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(document.file_size_bytes ?? document.file_size ?? 0)}
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              title="Open and inspect document"
              leftIcon={<Eye className="h-3.5 w-3.5 text-brand-600" />}
            >
              Open File
            </Button>

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

      {/* In-App File Viewer & Inspection Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={document.original_filename}
        description={`Category: ${formatDocumentType(document.document_type)} • Size: ${formatFileSize(
          document.file_size_bytes ?? document.file_size ?? 0
        )}`}
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 p-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in New Tab</span>
                </a>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Tabs for Raw File vs Extracted OCR/Data */}
          {hasExtractedData && (
            <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                Document Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'ocr'
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                Extracted Text &amp; AI Metadata
              </button>
            </div>
          )}

          {(!hasExtractedData || activeTab === 'preview') && (
            <div className="rounded-lg border border-surface-200 bg-surface-100/50 flex flex-col items-center justify-center min-h-[420px] max-h-[75vh] overflow-hidden">
              {isImage && fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl}
                  alt={document.original_filename}
                  className="max-h-[70vh] w-auto object-contain rounded p-2"
                />
              ) : isPdf && fileUrl ? (
                <iframe
                  src={`${fileUrl}#toolbar=1&navpanes=0`}
                  title={document.original_filename}
                  className="w-full h-[65vh] border-0 rounded bg-white"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-surface-200 text-surface-600">
                    {getFileIcon()}
                  </div>
                  <div>
                    <h5 className="font-semibold text-surface-800 text-sm">{document.original_filename}</h5>
                    <p className="text-xs text-surface-500 mt-1">
                      Direct preview is available via native PDF/image viewers or download.
                    </p>
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      download={document.original_filename}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {hasExtractedData && activeTab === 'ocr' && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {document.extracted_text && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-surface-600 mb-2">
                    Extracted Text &amp; OCR
                  </h5>
                  <div className="rounded-md bg-surface-900 text-surface-100 p-3 font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {document.extracted_text}
                  </div>
                </div>
              )}

              {document.extraction_metadata && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-surface-600 mb-2">
                    Structured Document Intelligence
                  </h5>
                  <pre className="rounded-md bg-surface-100 border border-surface-200 p-3 font-mono text-xs max-h-60 overflow-y-auto text-surface-800">
                    {JSON.stringify(document.extraction_metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
