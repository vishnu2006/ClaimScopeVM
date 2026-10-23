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
import { StarBorder } from '@/components/ui/StarBorder';
import RubberSegment from '@/components/ui/RubberSegment';
import { useTheme } from '@/context/ThemeContext';
import { CaseState, Evidence } from '@/lib/types';
import { ThoughtLine } from '@/components/ui/ThoughtLine';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        <LoadingState
          message="Retrieving claim investigation records..."
          steps={[
            'Connecting to ClaimScope intelligence layer',
            'Fetching claim docket metadata & claimant records',
            'Loading incident documents and forensic evidence',
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

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* ThoughtLine Live Investigation Orchestration Banner */}
        {isInvestigating && (
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-brand-500/30 bg-surface-0/95 dark:bg-[#121826]/95 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <ThoughtLine
              working={isInvestigating}
              steps={[
                'Classifying intake package documents & verifying signatures',
                'Running Gemini Vision forensic analysis on damage photos',
                'Extracting First Notice of Loss statements & Police reports',
                'Cross-referencing testimony across evidence documents',
                'Grounding claim via external weather & geospatial verification',
                'Synthesizing liability assessment & fraud risk score',
              ]}
              label="Multimodal Claim Investigation Orchestrator in progress…"
              doneLabel="Investigation concluded in"
              glyph="sparkle"
              fontSize={15}
              breathPeriod={1.5}
              collapsible={true}
              collapseOnSettle={false}
              showTimer={true}
              color="var(--color-brand-600, #2563eb)"
            />
          </div>
        )}
        {/* Pipeline Progress Status */}
        <CaseTimeline documents={documents} report={caseData.report} />

        {/* Adaptive LangGraph Stepper */}
        <InvestigationStepper
          executions={investigationState?.agent_executions}
          isInvestigating={isInvestigating}
        />

        {/* RubberSegment Navigation & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-surface-200 pb-3">
          {/* RubberSegment Control */}
          <div className="overflow-x-auto pb-1 max-w-full">
            <RubberSegment
              items={[
                {
                  value: 'documents',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Incident Package</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200/60 dark:bg-surface-700/60">
                        {documents.length}
                      </span>
                    </span>
                  )
                },
                {
                  value: 'evidence',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Search className="h-3.5 w-3.5" />
                      <span>Extracted Facts</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200/60 dark:bg-surface-700/60">
                        {evidenceList.length}
                      </span>
                    </span>
                  )
                },
                {
                  value: 'vision',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Vision Analysis</span>
                      {visionEntries.length > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200/60 dark:bg-surface-700/60">
                          {visionEntries.length}
                        </span>
                      )}
                    </span>
                  )
                },
                {
                  value: 'discrepancies',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <GitCompare className="h-3.5 w-3.5" />
                      <span>Discrepancies</span>
                      {discrepancies.length > 0 ? (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300">
                          {discrepancies.length}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200/60 dark:bg-surface-700/60">
                          0
                        </span>
                      )}
                    </span>
                  )
                },
                {
                  value: 'verification',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Globe className="h-3.5 w-3.5" />
                      <span>External Grounding</span>
                      {verifications.length > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-200/60 dark:bg-surface-700/60">
                          {verifications.length}
                        </span>
                      )}
                    </span>
                  )
                },
                {
                  value: 'report',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>Report</span>
                      {caseData.report && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </span>
                  )
                }
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as any)}
              trackColor={isDark ? '#17243b' : '#f1f5f9'}
              thumbColor={isDark ? '#086afc' : '#ffffff'}
              textColor={isDark ? '#94a7c4' : '#475569'}
              activeTextColor={isDark ? '#ffffff' : '#086afc'}
              size="md"
              radius={10}
              inset={3}
              equalSlots={false}
              stretch={80}
              squash={2}
              draggable
            />
          </div>

          {/* Action Button: Run / Re-run Investigation */}
          <div className="flex items-center gap-2 shrink-0">
            <StarBorder
              as="button"
              onClick={handleRunInvestigation}
              disabled={isInvestigating || documents.length === 0}
              color="#086afc"
              trailColor="#5eba46"
              duration={3.5}
              thickness={2}
              radius={8}
              glow={0.7}
              hover="lap"
              backgroundColor="#086afc"
              textColor="#ffffff"
              borderColor="rgba(8, 106, 252, 0.4)"
              className="!py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer inline-flex items-center disabled:opacity-50 disabled:pointer-events-none"
            >
              <Cpu className="h-3.5 w-3.5 mr-1.5" />
              <span>
                {isInvestigating
                  ? 'Investigating Package...'
                  : investigationState
                  ? 'Re-run Investigation'
                  : 'Run Adaptive Investigation'}
              </span>
            </StarBorder>
          </div>
        </div>

        {investigationError && (
          <div className="flex items-start gap-2.5 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{investigationError}</span>
          </div>
        )}

        {/* Tab 1: Documents & Intake */}
        <div className={activeTab === 'documents' ? 'space-y-6' : 'hidden'}>
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

        {/* Tab 2: Extracted Facts */}
        <div className={activeTab === 'evidence' ? 'block' : 'hidden'}>
          <EvidenceInspection evidences={evidenceList} />
        </div>

        {/* Tab 3: Vision Observations */}
        <div className={activeTab === 'vision' ? 'block' : 'hidden'}>
          <VisionObservations observations={investigationState?.vision_observations || {}} />
        </div>

        {/* Tab 4: Cross-Document Discrepancies */}
        <div className={activeTab === 'discrepancies' ? 'block' : 'hidden'}>
          <DiscrepancyList inconsistencies={discrepancies} />
        </div>

        {/* Tab 5: External Grounding */}
        <div className={activeTab === 'verification' ? 'block' : 'hidden'}>
          <ExternalVerificationList verifications={verifications} />
        </div>

        {/* Tab 6: Report Preview */}
        <div className={activeTab === 'report' ? 'space-y-4' : 'hidden'}>
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
      </div>
    </div>
  );
}
