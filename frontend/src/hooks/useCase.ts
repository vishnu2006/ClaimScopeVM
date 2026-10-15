'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { CaseDetail, CreateCaseData, Report } from '@/lib/types';
import { useApi } from './useApi';

export function useCase(id: string) {
  const fetcher = useCallback(() => {
    if (!id) return Promise.reject(new Error('Case ID is required'));
    return api.getCase(id);
  }, [id]);

  const { data: caseData, loading, error, refetch, setData } = useApi<CaseDetail>(
    fetcher,
    [id]
  );

  const updateCase = useCallback(
    async (data: Partial<CreateCaseData>): Promise<CaseDetail> => {
      const updated = await api.updateCase(id, data);
      setData(updated);
      return updated;
    },
    [id, setData]
  );

  const generateReport = useCallback(async (): Promise<Report> => {
    const report = await api.generateReport(id);
    setData((prev) => (prev ? { ...prev, report } : prev));
    return report;
  }, [id, setData]);

  return {
    caseData,
    loading,
    error,
    refetch,
    updateCase,
    generateReport,
    setCaseData: setData,
  };
}
