'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { Document } from '@/lib/types';
import { formatDocumentType } from '@/lib/utils';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  rawUrl?: string;
  targetPage?: number | null;
  highlightText?: string | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  rawUrl,
  targetPage,
  highlightText,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'text'>('preview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const isPdf = document.mime_type?.includes('pdf') || document.original_filename?.toLowerCase().endsWith('.pdf');
  const isImage = document.mime_type?.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(document.original_filename);

  const handleCopyText = () => {
    if (document.extracted_text) {
      navigator.clipboard.writeText(document.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Document Viewer"
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                {document.original_filename}
              </h3>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <span className="font-medium text-brand-700 dark:text-brand-400">
                  {formatDocumentType(document.document_type)}
                </span>
                {targetPage && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-surface-700 dark:text-surface-300">
                      Page {targetPage}
                    </span>
                  </>
                )}
                {document.file_size_bytes ? (
                  <>
                    <span>•</span>
                    <span>{(document.file_size_bytes / 1024).toFixed(1)} KB</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle if Extracted Text is Available */}
            {document.extracted_text && (
              <div className="hidden sm:flex items-center bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-surface-0 dark:bg-surface-700 text-surface-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                  }`}
                >
                  File Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('text')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'text'
                      ? 'bg-surface-0 dark:bg-surface-700 text-surface-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                  }`}
                >
                  Extracted Text
                </button>
              </div>
            )}

            {rawUrl && (
              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Highlight Banner if triggered by citation */}
        {highlightText && (
          <div className="px-5 py-2.5 bg-brand-50/70 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/60 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2">
            <span className="font-semibold shrink-0">Referenced finding excerpt:</span>
            <span className="italic font-serif">“{highlightText}”</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 min-h-[350px] max-h-[72vh] overflow-auto bg-surface-50/50 dark:bg-surface-950 p-4">
          {viewMode === 'text' && document.extracted_text ? (
            <div className="relative bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-800 font-mono text-xs leading-relaxed whitespace-pre-wrap text-surface-800 dark:text-surface-200 shadow-inner">
              <button
                type="button"
                onClick={handleCopyText}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-700 dark:text-surface-300 text-[11px] font-sans font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              {document.extracted_text}
            </div>
          ) : isImage && rawUrl ? (
            <div className="flex items-center justify-center p-2 min-h-[350px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rawUrl}
                alt={document.original_filename}
                className="max-w-full max-h-[66vh] object-contain rounded-lg shadow-md"
              />
            </div>
          ) : isPdf && rawUrl ? (
            <iframe
              src={targetPage ? `${rawUrl}#page=${targetPage}` : rawUrl}
              title={document.original_filename}
              className="w-full h-[66vh] rounded-lg border border-surface-200 dark:border-surface-800 bg-white"
            />
          ) : document.extracted_text ? (
            <div className="bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-800 font-mono text-xs leading-relaxed whitespace-pre-wrap text-surface-800 dark:text-surface-200">
              {document.extracted_text}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-surface-500">
              <FileText className="h-10 w-10 text-surface-400 mb-2" />
              <p className="text-sm font-medium">Document content is processed and securely archived.</p>
              {rawUrl && (
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={document.original_filename}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 dark:bg-surface-800 text-xs font-semibold text-surface-800 dark:text-surface-200 hover:bg-surface-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Original Document</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

