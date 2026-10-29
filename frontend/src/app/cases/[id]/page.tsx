'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  AlertCircle,
  Download,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { useCase } from '@/hooks/useCase';
import { useDocuments } from '@/hooks/useDocuments';
import { api } from '@/lib/api';
import { CaseHeader } from '@/components/cases/CaseHeader';
import { ContinuousInvestigationDossier } from '@/components/cases/ContinuousInvestigationDossier';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaseState } from '@/lib/types';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = (params?.id as string) || '';

  const {
    caseData,
    loading: caseLoading,
    error: caseError,
    refetch: refetchCase,
  } = useCase(caseId);

  const {
    documents,
    loading: docsLoading,
    refetch: refetchDocs,
  } = useDocuments(caseId);

  const [investigationState, setInvestigationState] = useState<CaseState | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Load existing investigation state if previously executed
  useEffect(() => {
    let isMounted = true;
    if (!caseId) return;

    api.getInvestigation(caseId)
      .then((state) => {
        if (isMounted && state) {
          setInvestigationState(state);
        }
      })
      .catch(() => {
        // No stored state yet
      });

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    if (!caseId) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await api.downloadReportPdf(caseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClaimScope_Report_${caseData?.case_number || caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download report PDF';
      setInvestigationError(msg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Run Investigation
  const handleRunInvestigation = async () => {
    if (!caseId) return;
    setIsInvestigating(true);
    setInvestigationError(null);
    try {
      const result = await api.runInvestigation(caseId);
      setInvestigationState(result);
      await refetchCase();
      await refetchDocs();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to execute claim investigation.';
      setInvestigationError(msg);
    } finally {
      setIsInvestigating(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingState
          message="Loading claim investigation file..."
          steps={[
            'Retrieving claim docket records',
            'Loading incident files and evidence',
          ]}
        />
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="flex-1 p-6 max-w-4xl mx-auto">
        <ErrorState
          title="Case Not Found or Inaccessible"
          message={caseError || 'Unable to locate case records.'}
          onRetry={refetchCase}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Case Header */}
      <CaseHeader
        caseData={caseData}
        onDeleted={() => router.push('/cases')}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error alert if any */}
        {investigationError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{investigationError}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            CASE HAS BEEN INVESTIGATED: RENDER CONTINUOUS DOSSIER
        ------------------------------------------------------------- */}
        {investigationState ? (
          <ContinuousInvestigationDossier
            caseData={caseData}
            investigation={investigationState}
            onDownloadPdf={handleDownloadPdf}
            isDownloadingPdf={isDownloadingPdf}
          />
        ) : isInvestigating ? (
          /* Live Investigation In Progress State */
          <div className="max-w-2xl mx-auto py-16 px-4 text-center">
            <div className="bg-surface-0 dark:bg-surface-850 p-8 sm:p-12 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xl space-y-6">
              <div className="inline-flex items-center justify-center p-4 bg-brand-50 dark:bg-brand-950/60 rounded-full text-brand-600 dark:text-brand-400">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
                  Investigating Claim Evidence
                </h2>
                <p className="text-xs sm:text-sm text-surface-500 max-w-md mx-auto">
                  Cross-referencing documentation, evaluating vehicle photographs, and preparing adjuster findings...
                </p>
              </div>

              <div className="space-y-2.5 text-left max-w-md mx-auto pt-4 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-600 dark:text-surface-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Verified submitted accident documents</span>
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-brand-600 dark:text-brand-400">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  <span>Inspecting vehicle damage photos and checking consistency...</span>
                </div>
                <div className="flex items-center gap-2.5 text-surface-400">
                  <div className="h-4 w-4 rounded-full border border-surface-300" />
                  <span>Synthesizing findings for claims adjuster review</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Case Ready For Investigation */
          <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="bg-surface-0 dark:bg-surface-850 p-8 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-md text-center space-y-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-brand-50 dark:bg-brand-950/60 rounded-2xl text-brand-600 dark:text-brand-400">
                <FileCheck2 className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  Ready to Investigate Claim {caseData.case_number}
                </h2>
                <p className="text-xs text-surface-500">
                  This claim package contains {caseData.documents.length} document(s) and photograph(s). Click below to begin the investigation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunInvestigation}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-md transition-all cursor-pointer"
                >
                  <span>Start Investigation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
