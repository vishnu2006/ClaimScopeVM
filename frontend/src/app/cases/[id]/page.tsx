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

  const [activeTab, setActiveTab] = useState<'documents' | 'evidence' | 'vision' | 'discrepancies' | 'report'>('documents');
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
      const msg = err instanceof Error ? err.message : 'Failed to execute adaptive investigation pipeline.';
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Case Header */}
      <CaseHeader
        caseData={caseData}
        onDeleted={() => router.push('/cases')}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Pipeline Progress */}
        <CaseTimeline
          documents={documents}
          report={caseData.report}
        />

        {/* Adaptive LangGraph Stepper */}
        <InvestigationStepper
          executions={investigationState?.agent_executions}
          isInvestigating={isInvestigating}
        />

        {/* Action & Tab Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-200 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Incident Documents</span>
              <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.2 text-[10px] text-surface-700 font-mono">
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Extracted Facts</span>
              <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.2 text-[10px] text-surface-700 font-mono">
                {evidenceList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'vision'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Vision Analysis</span>
              {visionEntries.length > 0 && (
                <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.2 text-[10px] text-surface-700 font-mono">
                  {visionEntries.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discrepancies')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'discrepancies'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <GitCompare className="h-4 w-4" />
              <span>Discrepancies</span>
              {discrepancies.length > 0 ? (
                <span className="ml-1 rounded-full bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 text-[10px]">
                  {discrepancies.length}
                </span>
              ) : (
                <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.2 text-[10px] text-surface-700 font-mono">
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Investigation Report</span>
              {caseData.report && (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Adaptive Investigation Action Trigger */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunInvestigation}
              loading={isInvestigating}
              disabled={documents.length === 0}
              leftIcon={<Cpu className="h-4 w-4" />}
            >
              {investigationState ? 'Re-run Investigation' : 'Run Adaptive Investigation'}
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
                <div className="sticky top-24">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                    Add Incident Files
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
                      size="sm"
                      onClick={() => refetchDocs()}
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-surface-900">
                  Extracted Facts &amp; Provenance
                </h3>
                <p className="text-xs text-surface-500">
                  Traceable claims facts extracted across submitted incident documents
                </p>
              </div>
            </div>

            {evidenceList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-surface-300 p-8 text-center space-y-3 bg-surface-50">
                <Search className="h-6 w-6 text-surface-400 mx-auto" />
                <h4 className="text-sm font-semibold text-surface-800">No Facts Extracted Yet</h4>
                <p className="text-xs text-surface-500 max-w-md mx-auto">
                  Click &quot;Run Adaptive Investigation&quot; or process individual documents to extract verifiable facts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-subtle">
                <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
                  <thead className="bg-surface-50 text-surface-600 font-medium">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Fact Field</th>
                      <th className="px-4 py-3">Extracted Value</th>
                      <th className="px-4 py-3">Source Citation</th>
                      <th className="px-4 py-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {evidenceList.map((ev) => (
                      <tr key={ev.id} className="hover:bg-surface-50/50">
                        <td className="px-4 py-3 font-semibold text-surface-700 capitalize">
                          {ev.category.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-surface-900 font-mono text-[11px]">
                          {ev.field_name}
                        </td>
                        <td className="px-4 py-3 text-surface-800 font-medium max-w-xs truncate">
                          {ev.field_value || 'None'}
                        </td>
                        <td className="px-4 py-3 text-surface-500 font-mono text-[11px]">
                          {ev.source_document || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {ev.confidence !== null && ev.confidence !== undefined ? (
                            <span className="font-mono text-emerald-700 font-medium">
                              {(ev.confidence * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-surface-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Vision Observations */}
        {activeTab === 'vision' && (
          <VisionObservations observations={investigationState?.vision_observations || {}} />
        )}

        {/* Tab 4: Cross-Document Discrepancies */}
        {activeTab === 'discrepancies' && (
          <DiscrepancyList inconsistencies={discrepancies} />
        )}

        {/* Tab 5: Report Preview */}
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
                description="Run the investigation or click Generate Report to create a comprehensive findings report."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
