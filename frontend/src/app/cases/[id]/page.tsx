'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  Camera,
  GitCompare,
  Cpu,
  Globe,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { useCase } from '@/hooks/useCase';
import { useDocuments } from '@/hooks/useDocuments';
import { api } from '@/lib/api';
import { CaseHeader } from '@/components/cases/CaseHeader';
import { CaseTimeline } from '@/components/cases/CaseTimeline';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { InvestigationStepper } from '@/components/cases/InvestigationStepper';
import { VisionObservations } from '@/components/cases/VisionObservations';
import { DiscrepancyList } from '@/components/cases/DiscrepancyList';
import { EvidenceInspection } from '@/components/cases/EvidenceInspection';
import { ExternalVerificationList } from '@/components/cases/ExternalVerificationList';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CaseState, Evidence } from '@/lib/types';

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
    uploadDocuments,
    processDocument,
    deleteDocument,
    refetch: refetchDocs,
  } = useDocuments(caseId);

  const [activeTab, setActiveTab] = useState<
    'documents' | 'evidence' | 'vision' | 'discrepancies' | 'verification' | 'report'
  >('documents');
  const [investigationState, setInvestigationState] = useState<CaseState | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  // Poll investigation state while running so stepper updates live
  useEffect(() => {
    if (!isInvestigating || !caseId) return;
    const interval = setInterval(() => {
      api.getInvestigation(caseId)
        .then((state) => {
          if (state) setInvestigationState(state);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [isInvestigating, caseId]);

  const loadInvestigation = async () => {
    if (!caseId) return;
    try {
      const state = await api.getInvestigation(caseId);
      if (state) {
        setInvestigationState(state);
      }
    } catch {
      // No stored state yet
    }
  };

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

  // Run LangGraph Adaptive Investigation
  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    setInvestigationError(null);
    try {
      const result = await api.runInvestigation(caseId);
      setInvestigationState(result);
      await refetchCase();
      await refetchDocs();

      // Automatically focus on discrepancies if found, or evidence
      if (result.inconsistencies && result.inconsistencies.length > 0) {
        setActiveTab('discrepancies');
      } else if (Object.keys(result.vision_observations || {}).length > 0) {
        setActiveTab('vision');
      } else {
        setActiveTab('evidence');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to execute adaptive investigation pipeline.';
      setInvestigationError(msg);
    } finally {
      setIsInvestigating(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingState message="Retrieving case investigation records..." />
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

  const evidenceList: Evidence[] = caseData.evidences || [];
  const visionEntries = Object.entries(investigationState?.vision_observations || {});
  const discrepancies = investigationState?.inconsistencies || [];
  const verifications = investigationState?.web_verifications || [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Case Header */}
      <CaseHeader
        caseData={caseData}
        onDeleted={() => router.push('/cases')}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Pipeline Progress Status */}
        <CaseTimeline documents={documents} report={caseData.report} />

        {/* Adaptive LangGraph Stepper */}
        <InvestigationStepper
          executions={investigationState?.agent_executions}
          isInvestigating={isInvestigating}
        />

        {/* Linear-Style Tabs & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-200 pb-2">
          {/* Tabs Group */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Tab 1: Documents */}
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Incident Package</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-600 border border-surface-200">
                {documents.length}
              </span>
            </button>

            {/* Tab 2: Extracted Facts */}
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Extracted Facts</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-600 border border-surface-200">
                {evidenceList.length}
              </span>
            </button>

            {/* Tab 3: Vision Analysis */}
            <button
              type="button"
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'vision'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Vision Analysis</span>
              {visionEntries.length > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-600 border border-surface-200">
                  {visionEntries.length}
                </span>
              )}
            </button>

            {/* Tab 4: Discrepancies */}
            <button
              type="button"
              onClick={() => setActiveTab('discrepancies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'discrepancies'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Discrepancies</span>
              {discrepancies.length > 0 ? (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {discrepancies.length}
                </span>
              ) : (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-400">
                  0
                </span>
              )}
            </button>

            {/* Tab 5: External Grounding */}
            <button
              type="button"
              onClick={() => setActiveTab('verification')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>External Grounding</span>
              {verifications.length > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-600 border border-surface-200">
                  {verifications.length}
                </span>
              )}
            </button>

            {/* Tab 6: Report */}
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-surface-0 text-brand-700 shadow-xs border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Report</span>
              {caseData.report && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Action Button: Run / Re-run Investigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunInvestigation}
              loading={isInvestigating}
              disabled={isInvestigating || documents.length === 0}
              leftIcon={<Cpu className="h-3.5 w-3.5" />}
            >
              {isInvestigating
                ? 'Investigating Package...'
                : investigationState
                ? 'Re-run Investigation'
                : 'Run Adaptive Investigation'}
            </Button>
          </div>
        </div>

        {investigationError && (
          <div className="flex items-start gap-2.5 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{investigationError}</span>
          </div>
        )}

        {/* Tab 1: Documents & Intake */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                    Ingest Incident Files
                  </h3>
                  <DocumentUpload
                    caseId={caseId}
                    onUpload={async (files) => {
                      await uploadDocuments(files);
                      await refetchCase();
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">
                    Uploaded Package Files ({documents.length})
                  </h3>
                  {documents.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => refetchDocs()}
                      leftIcon={<RefreshCw className="h-3 w-3" />}
                    >
                      Refresh
                    </Button>
                  )}
                </div>

                <DocumentList
                  documents={documents}
                  loading={docsLoading}
                  onProcess={async (docId) => {
                    await processDocument(docId);
                    await refetchCase();
                    await loadInvestigation();
                  }}
                  onDelete={async (docId) => {
                    await deleteDocument(docId);
                    await refetchCase();
                    await loadInvestigation();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Extracted Facts */}
        {activeTab === 'evidence' && (
          <EvidenceInspection evidences={evidenceList} />
        )}

        {/* Tab 3: Vision Observations */}
        {activeTab === 'vision' && (
          <VisionObservations observations={investigationState?.vision_observations || {}} />
        )}

        {/* Tab 4: Cross-Document Discrepancies */}
        {activeTab === 'discrepancies' && (
          <DiscrepancyList inconsistencies={discrepancies} />
        )}

        {/* Tab 5: External Grounding */}
        {activeTab === 'verification' && (
          <ExternalVerificationList verifications={verifications} />
        )}

        {/* Tab 6: Report Preview */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {caseData.report ? (
              <ReportPreview
                report={caseData.report}
                caseNumber={caseData.case_number}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
              />
            ) : (
              <EmptyState
                title="No report generated yet"
                description="Run the adaptive investigation or click Generate Report to compile multi-document findings."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
