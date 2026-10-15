'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { CaseDetail, CaseSummary, CreateCaseData } from '@/lib/types';
import { useApi } from './useApi';

export function useCases() {
  const fetcher = useCallback(() => api.getCases(), []);
  const { data: cases, loading, error, refetch, setData } = useApi<CaseSummary[]>(fetcher, []);

  const createCase = useCallback(
    async (data: CreateCaseData): Promise<CaseDetail> => {
      const newCase = await api.createCase(data);
      // Refresh list
      await refetch();
      return newCase;
    },
    [refetch]
  );

  const deleteCase = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteCase(id);
      setData((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    },
    [setData]
  );

  return {
    cases,
    loading,
    error,
    refetch,
    createCase,
    deleteCase,
  };
}
