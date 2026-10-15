'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import { Document, DocumentUploadResult, ProcessingResult } from '@/lib/types';
import { useApi } from './useApi';

export function useDocuments(caseId: string) {
  const fetcher = useCallback(() => {
    if (!caseId) return Promise.resolve([]);
    return api.getDocuments(caseId);
  }, [caseId]);

  const { data: documents, loading, error, refetch, setData } = useApi<Document[]>(
    fetcher,
    [caseId]
  );

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadDocuments = useCallback(
    async (files: File[]): Promise<DocumentUploadResult[]> => {
      setUploading(true);
      setUploadError(null);
      try {
        const results = await api.uploadDocuments(caseId, files);
        await refetch();
        return results;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to upload files';
        setUploadError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [caseId, refetch]
  );

  const processDocument = useCallback(
    async (docId: string): Promise<ProcessingResult> => {
      // Optimistically update document status to processing
      setData((prev) =>
        prev
          ? prev.map((d) =>
              d.id === docId ? { ...d, processing_status: 'processing' as const } : d
            )
          : prev
      );

      try {
        const result = await api.processDocument(caseId, docId);
        await refetch();
        return result;
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [caseId, refetch, setData]
  );

  const deleteDocument = useCallback(
    async (docId: string): Promise<void> => {
      await api.deleteDocument(caseId, docId);
      setData((prev) => (prev ? prev.filter((d) => d.id !== docId) : prev));
    },
    [caseId, setData]
  );

  return {
    documents: documents || [],
    loading,
    error,
    uploading,
    uploadError,
    refetch,
    uploadDocuments,
    processDocument,
    deleteDocument,
  };
}
