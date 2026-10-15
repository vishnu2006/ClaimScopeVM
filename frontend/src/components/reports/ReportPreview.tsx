'use client';

import React from 'react';
import {
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  FileSearch,
  Globe,
  Info,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Report } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ReportSection } from './ReportSection';

export interface ReportPreviewProps {
  report: Report;
  caseNumber?: string;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  caseNumber,
  onPrint,
  onDownloadPdf,
  isDownloadingPdf,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const getRecommendationConfig = () => {
    const outcome = report?.outcome || report?.recommendation;
    if (outcome === 'ROUTINE_REVIEW' || outcome === 'routine') {
      return {
        title: 'Routine Processing Recommended',
        subtitle: 'Consistent incident documentation with standard repair profile.',
        badgeVariant: 'success' as const,
        borderClass: 'border-emerald-300 bg-emerald-50/50 text-emerald-950',
        icon: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />,
      };
    }
    if (outcome === 'ADDITIONAL_INFORMATION_REQUIRED' || outcome === 'flag_for_review') {
      return {
        title: 'Additional Information Required',
        subtitle: 'Cross-document discrepancies, missing documentation, or scope anomalies detected.',
        badgeVariant: 'warning' as const,
        borderClass: 'border-amber-300 bg-amber-50/50 text-amber-950',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
      };
    }
    if (outcome === 'ESCALATE_FOR_HUMAN_REVIEW' || outcome === 'escalate') {
      return {
        title: 'Escalate for Senior Human Review',
        subtitle: 'Suspected material inconsistency, vehicle identification conflict, or significant coverage exposure.',
        badgeVariant: 'error' as const,
        borderClass: 'border-rose-300 bg-rose-50/50 text-rose-950',
        icon: <ShieldAlert className="h-5 w-5 text-status-error shrink-0" />,
      };
    }
    return {
      title: 'Preliminary Review Required',
      subtitle: 'Awaiting further document grounding.',
      badgeVariant: 'info' as const,
      borderClass: 'border-blue-200 bg-blue-50/40 text-blue-950',
      icon: <Info className="h-5 w-5 text-brand-600 shrink-0" />,
    };
  };

  const recConfig = getRecommendationConfig();

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Print / Export Action Bar (hidden in print) */}
      <div className="flex items-center justify-between bg-surface-0 border border-surface-200 rounded-lg p-4 shadow-subtle print:hidden">
        <div>
          <h2 className="text-sm font-bold text-surface-900">
            Investigation Assessment Report
          </h2>
          <p className="text-xs text-surface-500">
            Synthesized multi-document findings and adjustor recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <Button
              variant="primary"
              size="sm"
              onClick={onDownloadPdf}
              loading={isDownloadingPdf}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download PDF
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Main Report Document Container */}
      <div className="bg-surface-0 border border-surface-200 rounded-lg shadow-card p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Official Header */}
        <div className="border-b border-surface-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base tracking-tight text-brand-900 uppercase">
                  ClaimScope
                </span>
                <span className="text-xs text-surface-400">|</span>
                <span className="text-xs font-medium text-surface-600 uppercase tracking-wider">
                  Accident Claim Investigation
                </span>
              </div>
              <h1 className="text-xl font-bold text-surface-900">
                Case Assessment File: {caseNumber || report.case_number || report.case_id}
              </h1>
            </div>

            <div className="flex flex-col sm:items-end text-xs text-surface-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-surface-400" />
                <span>Generated: {formatDateTime(report.generated_at || report.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Status:</span>
                <Badge variant={report.status === 'final' ? 'success' : 'pending'} size="sm">
                  {(report.status || 'preliminary').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustor Recommendation Banner */}
        <div className={`rounded-lg border p-4.5 ${recConfig.borderClass} flex items-start gap-3.5 shadow-subtle`}>
          {recConfig.icon}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">{recConfig.title}</h3>
              <Badge variant={recConfig.badgeVariant} size="sm">
                {(report.recommendation || 'preliminary').replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {report.recommendation_rationale || recConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Executive Incident Summary */}
        <ReportSection title="1. Executive Incident Summary">
          <p className="text-surface-700 leading-relaxed text-xs sm:text-sm">
            {report.incident_summary || report.summary || 'No incident summary available.'}
          </p>
        </ReportSection>

        {/* Document Intake & Package Analysis */}
        <ReportSection title="2. Incident Package & Document AI Intake">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-surface-200 bg-surface-50 p-3.5">
              <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileSearch className="h-3.5 w-3.5 text-brand-600" />
                Analyzed Documents ({report.document_analysis?.analyzed_documents?.length || 0})
              </h4>
              {report.document_analysis?.analyzed_documents?.length ? (
                <ul className="space-y-1">
                  {report.document_analysis.analyzed_documents.map((doc, idx) => (
                    <li key={idx} className="text-xs text-surface-700 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-surface-500 italic">No documents analyzed.</p>
              )}
            </div>

            <div className="rounded-md border border-surface-200 bg-surface-50 p-3.5">
              <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-surface-500" />
                Missing Supporting Documentation
              </h4>
              {report.document_analysis?.missing_documents?.length ? (
                <ul className="space-y-1">
                  {report.document_analysis.missing_documents.map((item, idx) => (
                    <li key={idx} className="text-xs text-surface-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  All standard incident package documents accounted for.
                </p>
              )}
            </div>
          </div>
        </ReportSection>

        {/* Cross-Document Consistency & Inconsistency Checks */}
        <ReportSection
          title="3. Cross-Document Consistency Analysis"
          badge={
            report.inconsistencies && report.inconsistencies.length > 0
              ? `${report.inconsistencies.length} Discrepanc${report.inconsistencies.length === 1 ? 'y' : 'ies'} Found`
              : 'Consistent'
          }
          badgeVariant={
            report.inconsistencies && report.inconsistencies.length > 0 ? 'warning' : 'success'
          }
        >
          {report.inconsistencies && report.inconsistencies.length > 0 ? (
            <div className="space-y-3">
              {report.inconsistencies.map((inc, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-amber-200 bg-amber-50/40 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-950 text-xs">
                      {inc.title}
                    </span>
                    <Badge
                      variant={inc.severity === 'high' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {inc.severity.toUpperCase()} SEVERITY
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {inc.description}
                  </p>
                  {inc.sources && inc.sources.length > 0 && (
                    <div className="text-[11px] text-amber-700 pt-1 font-mono">
                      Sources Compared: {inc.sources.join(' vs. ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-xs text-emerald-900">
                  No Inconsistencies Detected
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Reported narrative, point of vehicle contact, and visual damage characteristics match across submitted records.
                </p>
              </div>
            </div>
          )}
        </ReportSection>

        {/* Real-Time Web Grounding & Market Verification */}
        {report.web_verifications && report.web_verifications.length > 0 && (
          <ReportSection title="4. Real-Time Web Verification & Benchmark Grounding">
            <div className="space-y-3">
              {report.web_verifications.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-surface-200 bg-surface-50 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-surface-900 text-xs flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-brand-600" />
                      Verification: {item.query}
                    </span>
                    {item.grounded_cost_range && (
                      <span className="font-mono text-xs font-bold text-surface-900 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                        Est: {item.grounded_cost_range}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-700 leading-relaxed">
                    {item.finding}
                  </p>
                  {item.source_url && (
                    <div className="text-[11px] text-surface-500 truncate pt-1">
                      Source:{' '}
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {item.source_url}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* Triggered Review Rules & Action Protocols */}
        {((report.triggered_rules && report.triggered_rules.length > 0) || (report.recommended_actions && report.recommended_actions.length > 0)) && (
          <ReportSection
            title="5. Adjuster Review Triggers & Action Protocols"
            badge={report.triggered_rules?.length ? `${report.triggered_rules.length} Rule Triggered` : undefined}
            badgeVariant={report.triggered_rules?.some(r => r.severity === 'critical' || r.severity === 'high') ? 'error' : 'warning'}
          >
            <div className="space-y-4">
              {report.triggered_rules && report.triggered_rules.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
                    Triggered Assessment Rules
                  </h4>
                  <div className="divide-y divide-surface-200 border border-surface-200 rounded-md overflow-hidden bg-surface-50/50">
                    {report.triggered_rules.map((rule, idx) => (
                      <div key={idx} className="p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-surface-900 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-surface-200 text-surface-700 text-[10px]">{rule.rule_id}</span>
                            {rule.rule_name}
                          </span>
                          <Badge
                            variant={rule.severity === 'critical' || rule.severity === 'high' ? 'error' : rule.severity === 'medium' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {rule.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-surface-600 text-[11px] leading-relaxed">{rule.rationale || rule.description}</p>
                        {rule.recommended_action && (
                          <div className="text-[11px] text-brand-800 font-medium bg-brand-50 p-2 rounded border border-brand-100">
                            Recommended Next Step: {rule.recommended_action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommended_actions && report.recommended_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
                    Recommended Adjuster Action Items
                  </h4>
                  <ul className="space-y-1.5">
                    {report.recommended_actions.map((act, idx) => (
                      <li key={idx} className="text-xs text-surface-700 flex items-start gap-2 bg-surface-50 p-2.5 rounded border border-surface-200">
                        <span className="text-brand-600 font-bold shrink-0 mt-0.5">{idx + 1}.</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ReportSection>
        )}

        {/* Extracted Facts Matrix */}
        {report.extracted_facts && Object.keys(report.extracted_facts).length > 0 && (
          <ReportSection title="6. Extracted Fact Verification Matrix">
            <div className="rounded-md border border-surface-200 overflow-hidden">
              <div className="divide-y divide-surface-200 bg-surface-0">
                {Object.entries(report.extracted_facts).map(([key, val]) => {
                  let displayVal = '';
                  if (typeof val === 'object' && val !== null) {
                    // check if field with provenance
                    if ('value' in val) {
                      displayVal = String((val as { value: unknown }).value);
                    } else {
                      displayVal = JSON.stringify(val);
                    }
                  } else {
                    displayVal = String(val);
                  }

                  return (
                    <div key={key} className="grid grid-cols-3 p-2.5 text-xs">
                      <span className="font-medium text-surface-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="col-span-2 text-surface-900 font-medium">
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ReportSection>
        )}

        {/* Current Limitations & Exclusions */}
        {report.limitations && report.limitations.length > 0 && (
          <ReportSection title="7. Investigation Scope & Identified Limitations">
            <ul className="space-y-1.5">
              {report.limitations.map((limit, idx) => (
                <li
                  key={idx}
                  className="text-xs text-surface-600 flex items-start gap-2"
                >
                  <span className="text-surface-400 shrink-0 mt-0.5">•</span>
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* Regulatory & Adjustor Guardrail Notice */}
        <div className="rounded-lg bg-surface-100 border border-surface-200 p-4 text-[11px] text-surface-500 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-surface-700">
            <ShieldCheck className="h-4 w-4 text-surface-600" />
            <span>ClaimScope AI Decision-Support Notice</span>
          </div>
          <p>
            This preliminary investigation assessment was compiled automatically from submitted incident files, Document AI structured extraction, cross-document reconciliation, and public benchmark data. It serves as an assistive workflow tool for licensed insurance adjustors and does not replace human liability determination, coverage evaluation, or settlement authorization.
          </p>
        </div>
      </div>
    </div>
  );
};
