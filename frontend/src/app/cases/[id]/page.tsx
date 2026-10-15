'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  FileCheck2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useCase } from '@/hooks/useCase';
import { useDocuments } from '@/hooks/useDocuments';
import { CaseHeader } from '@/components/cases/CaseHeader';
import { CaseTimeline } from '@/components/cases/CaseTimeline';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Evidence } from '@/lib/types';

function CaseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const caseId = (params?.id as string) || '';

  const {
    caseData,
    loading: caseLoading,
    error: caseError,
    refetch: refetchCase,
    generateReport,
  } = useCase(caseId);

  const {
    documents,
    loading: docsLoading,
    uploadDocuments,
    processDocument,
    deleteDocument,
    refetch: refetchDocs,
  } = useDocuments(caseId);

  const [activeTab, setActiveTab] = useState<'documents' | 'evidence' | 'report'>('documents');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      await generateReport();
      setActiveTab('report');
      await refetchCase();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate investigation report.';
      setReportError(msg);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingState message="Retrieving case investigation package..." />
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

  const evidenceList: Evidence[] = caseData.evidence || [];
  const processedDocsCount = documents.filter((d) => d.processing_status === 'completed').length;

  return (
    <div className="flex-1 flex flex-col">
      {/* Case Header */}
      <CaseHeader
        caseData={caseData}
        onDeleted={() => router.push('/cases')}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Pipeline Progress */}
        <CaseTimeline
          documents={documents}
          report={caseData.report}
        />

        {/* Tab Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-surface-0 text-brand-700 shadow-subtle border border-surface-200'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Extracted Evidence</span>
              <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.2 text-[10px] text-surface-700 font-mono">
                {evidenceList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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

          {/* Action button to generate report */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateReport}
              loading={generatingReport}
              disabled={documents.length === 0}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              {caseData.report ? 'Regenerate Investigation Report' : 'Generate Investigation Report'}
            </Button>
          </div>
        </div>

        {reportError && (
          <div className="flex items-start gap-2.5 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reportError}</span>
          </div>
        )}

        {/* Tab 1: Documents & Intake */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Dropzone */}
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

              {/* Uploaded Documents List */}
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
                  }}
                  onDelete={async (docId) => {
                    await deleteDocument(docId);
                    await refetchCase();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Extracted Evidence */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-surface-900">
                  Extracted Facts &amp; Provenance
                </h3>
                <p className="text-xs text-surface-500">
                  Structured claims evidence identified across submitted documents with cross-referencing
                </p>
              </div>
            </div>

            {evidenceList.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No evidence extracted yet"
                description={
                  documents.length === 0
                    ? 'Upload accident documents first to begin automated multi-document extraction.'
                    : processedDocsCount === 0
                    ? 'Process the uploaded documents to extract structured facts and scene findings.'
                    : 'No structured facts were returned by the Document AI extractors for this package.'
                }
                actionLabel={documents.length === 0 ? 'Go to Documents' : undefined}
                onAction={() => setActiveTab('documents')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceList.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 bg-surface-0 shadow-card transition-all ${
                      item.is_inconsistency
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.is_inconsistency && (
                          <Badge variant="warning" size="sm">
                            Inconsistency Flag
                          </Badge>
                        )}
                        <span className="text-[11px] font-mono text-surface-500">
                          {Math.round(item.confidence <= 1 ? item.confidence * 100 : item.confidence)}% conf
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-surface-900 font-medium leading-relaxed mb-3">
                      {item.fact}
                    </p>

                    {item.inconsistency_details && (
                      <div className="rounded bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 mb-3 flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{item.inconsistency_details}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-surface-400 border-t border-surface-100 pt-2 font-mono">
                      <span>Source: {item.source}</span>
                      <span className="uppercase text-[10px] bg-surface-100 px-1.5 py-0.5 rounded text-surface-600">
                        {item.source_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Investigation Report */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {caseData.report ? (
              <ReportPreview
                report={caseData.report}
                caseNumber={caseData.case_number}
              />
            ) : (
              <EmptyState
                icon={FileCheck2}
                title="Investigation report not generated yet"
                description="Synthesize document AI extractions, verify facts with real-time web search, and produce an adjustor assessment report."
                actionLabel="Generate Report Now"
                onAction={handleGenerateReport}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <LoadingState message="Retrieving case investigation package..." />
        </div>
      }
    >
      <CaseDetailContent />
    </Suspense>
  );
}
