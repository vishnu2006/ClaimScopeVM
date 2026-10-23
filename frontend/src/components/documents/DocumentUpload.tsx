'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThoughtLine } from '@/components/ui/ThoughtLine';

export interface DocumentUploadProps {
  caseId?: string;
  onUpload: (files: File[]) => Promise<unknown>;
  className?: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((incomingFiles: FileList | File[]) => {
    setUploadError(null);
    setUploadSuccess(false);

    const validList: File[] = [];
    const errors: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}" has an unsupported format. Allowed: PDF, JPG, PNG, TIFF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        return;
      }
      validList.push(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join(' '));
    }

    if (validList.length > 0) {
      setSelectedFiles((prev) => {
        // Deduplicate by name and size
        const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
        const newOnes = validList.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
        return [...prev, ...newOnes];
      });
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // reset input value so re-uploading same file name works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check network connection.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center',
          isDragOver
            ? 'border-brand-500 bg-brand-50/60'
            : 'border-surface-300 hover:border-brand-400 bg-surface-50/40 hover:bg-surface-50'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-3 shadow-subtle">
          <UploadCloud className="h-6 w-6 stroke-[1.75]" />
        </div>
        <p className="text-sm font-semibold text-surface-900 mb-1">
          Click to upload or drag & drop claim files
        </p>
        <p className="text-xs text-surface-500 max-w-sm mb-2">
          Upload FNOL forms, police reports, scene photos, and damage estimates.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-surface-400">
          <span>Supported: PDF, JPG, PNG, TIFF</span>
          <span>·</span>
          <span>Max {MAX_FILE_SIZE_MB}MB each</span>
        </div>
      </div>

      {/* Error alert */}
      {uploadError && (
        <div className="flex items-start gap-2.5 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Success banner */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Files uploaded successfully and added to the case intake queue.</span>
        </div>
      )}

      {/* Selected file queue */}
      {selectedFiles.length > 0 && (
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-surface-100 pb-2">
            <span className="text-xs font-semibold text-surface-800">
              Files Queued for Intake ({selectedFiles.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="text-xs text-surface-500 hover:text-surface-800 h-7"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between rounded-md bg-surface-50 border border-surface-200 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="truncate font-medium text-surface-800">
                    {file.name}
                  </span>
                  <span className="text-surface-400 font-mono text-[11px] shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={uploading}
                  className="rounded p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="p-3.5 rounded-xl border border-brand-200/90 dark:border-brand-800 bg-brand-50/80 dark:bg-brand-950/40 shadow-xs mb-3">
              <ThoughtLine
                working={uploading}
                steps={[
                  'Streaming file payloads to ClaimScope repository',
                  'Verifying MIME headers and storage integrity',
                  'Cataloging files into Evidence Vault',
                ]}
                label="Uploading & cataloging claim documents…"
                doneLabel="Documents uploaded in"
                fontSize={13}
                showTimer
                color="var(--color-brand-600, #2563eb)"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartUpload}
              loading={uploading}
              leftIcon={<UploadCloud className="h-4 w-4" />}
            >
              Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
