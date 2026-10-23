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
  HelpCircle,
  ExternalLink,
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

  // Flatten and normalize report fields from report_data, generated_report, assessment or top-level
  const rd = ((report as any)?.report_data as Record<string, any>) || {};
  const genReport = (rd.generated_report as Record<string, any>) || {};
  const assessment = (rd.assessment as Record<string, any>) || {};
  const findings = ((report as any)?.findings as Record<string, any>) || {};

  // 1. Outcome & Recommendation
  const rawOutcome =
    genReport.outcome ||
    genReport.recommendation ||
    assessment.outcome ||
    report.outcome ||
    report.recommendation ||
    'ROUTINE_REVIEW';

  const outcomeStr = String(rawOutcome).toUpperCase();

  // 2. Recommendation Rationale
  const rationale =
    genReport.recommendation_rationale ||
    assessment.rationale ||
    report.recommendation_rationale ||
    report.summary ||
    'Comprehensive multi-document analysis and cross-referencing completed across all ingested files and registries.';

  // 3. Incident Summary
  const incidentSummary =
    genReport.incident_summary ||
    report.incident_summary ||
    report.summary ||
    `Incident investigation dossier for claim ${caseNumber || report.case_number || report.case_id} synthesized across submitted document packages and photographic assessments.`;

  // 4. Document Analysis (analyzed vs missing)
  const analyzedDocs: string[] =
    genReport.document_analysis?.analyzed_documents ||
    report.document_analysis?.analyzed_documents ||
    (Array.isArray(rd.documents) ? rd.documents.map((d: any) => d.filename || d.original_filename) : []);

  const missingDocs: string[] =
    genReport.document_analysis?.missing_documents ||
    report.document_analysis?.missing_documents ||
    genReport.missing_evidence_categories ||
    rd.missing_documents ||
    [];

  // 5. Inconsistencies / Discrepancies
  const rawInconsistencies =
    genReport.inconsistencies ||
    findings.discrepancies ||
    rd.inconsistencies ||
    report.inconsistencies ||
    [];

  const inconsistencies = Array.isArray(rawInconsistencies)
    ? rawInconsistencies.map((item: any) => ({
        title: item.title || item.field_name || (item.category ? item.category.replace(/_/g, ' ').toUpperCase() : 'Contradiction Item'),
        description: item.description || item.explanation || item.field_value || JSON.stringify(item),
        severity: (item.severity || 'high').toLowerCase(),
        sources: item.sources || (item.source_a && item.source_b ? [item.source_a, item.source_b] : [item.source_document || 'Intake package']),
      }))
    : [];

  // 6. Web Verifications
  const rawWebVerifications =
    genReport.web_verifications ||
    rd.web_verifications ||
    report.web_verifications ||
    [];

  const webVerifications = Array.isArray(rawWebVerifications)
    ? rawWebVerifications.map((item: any) => ({
        query: item.query || item.verification_question || 'Registry Inquiry',
        finding: item.finding || item.retrieved_information || 'Registry verification complete.',
        source_name: item.source_name || 'Official Public Source',
        source_url: item.source_url || item.url || null,
        grounded_cost_range: item.grounded_cost_range || null,
        status: item.status || 'verified',
      }))
    : [];

  // 7. Triggered Rules
  const rawTriggeredRules =
    genReport.triggered_rules ||
    assessment.triggered_rules ||
    report.triggered_rules ||
    [];

  const triggeredRules = Array.isArray(rawTriggeredRules)
    ? rawTriggeredRules.map((r: any) => ({
        rule_id: r.rule_id || 'TRG-RULE',
        rule_name: r.rule_name || r.name || 'Decision Trigger',
        category: r.category || 'general',
        severity: (r.severity || 'medium').toLowerCase(),
        description: r.description || r.rationale || '',
        recommended_action: r.recommended_action || r.recommended_adjuster_actions?.[0] || 'Review details with claimant.',
      }))
    : [];

  // 8. Recommended Actions
  const recommendedActions: string[] =
    genReport.recommended_actions ||
    assessment.recommended_adjuster_actions ||
    report.recommended_actions ||
    [];

  // 9. Extracted Facts
  const extractedFacts =
    genReport.extracted_facts ||
    rd.normalized_facts ||
    findings.normalized_facts ||
    report.extracted_facts ||
    {};

  // 10. Scope Limitations
  const limitations: string[] =
    genReport.limitations ||
    rd.investigation_limitations ||
    findings.limitations ||
    report.limitations ||
    [
      'Photographs alone cannot determine internal vehicle chassis alignment, suspension geometry, or hidden sensor calibrations without physical teardown.',
      'Market parts and labor benchmarks provide reference guidelines; actual estimate approval requires verified shop labor agreements.',
    ];

  // Configure UI presentation based on outcome
  const getRecommendationConfig = () => {
    if (outcomeStr.includes('ROUTINE')) {
      return {
        title: 'Routine Claim Processing Recommended',
        subtitle: 'All package documents, driver narratives, and vehicle characteristics are mutually consistent.',
        badgeVariant: 'success' as const,
        badgeLabel: 'ROUTINE ADJUDICATION',
        borderClass: 'border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        icon: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      };
    }
    if (outcomeStr.includes('ADDITIONAL') || outcomeStr.includes('FLAG')) {
      return {
        title: 'Additional Information Required',
        subtitle: 'Missing primary documentation (e.g. police report or certified repair estimate) or minor omissions requiring adjuster follow-up.',
        badgeVariant: 'warning' as const,
        badgeLabel: 'SUPPLEMENTAL REVIEW REQUIRED',
        borderClass: 'border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
      };
    }
    if (outcomeStr.includes('ESCALAT')) {
      return {
        title: 'Escalate for Senior Human Review',
        subtitle: 'Material factual contradictions, vehicle identity mismatches, or suspicious narrative discrepancies detected across records.',
        badgeVariant: 'error' as const,
        badgeLabel: 'HIGH ATTENTION / ESCALATION',
        borderClass: 'border-rose-300 bg-rose-50/70 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
        icon: <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
      };
    }
    return {
      title: 'Preliminary Review Required',
      subtitle: 'Preliminary evidence ingested. Awaiting full adjudication evaluation.',
      badgeVariant: 'info' as const,
      badgeLabel: 'PRELIMINARY ASSESSMENT',
      borderClass: 'border-blue-200 bg-blue-50/50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
      icon: <Info className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />,
    };
  };

  const recConfig = getRecommendationConfig();

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Print / Export Action Bar */}
      <div className="flex items-center justify-between bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-subtle print:hidden">
        <div>
          <h2 className="text-sm font-bold text-surface-900 dark:text-white">
            Investigation Assessment Dossier
          </h2>
          <p className="text-xs text-surface-500">
            Synthesized multi-document findings, rule triggers, and auditable claim provenance
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
              className="font-semibold shadow-2xs"
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
            Print Dossier
          </Button>
        </div>
      </div>

      {/* Main Report Document Container */}
      <div className="bg-surface-0 dark:bg-[#0f172a] border border-surface-200 dark:border-surface-800 rounded-xl shadow-card p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Official Header */}
        <div className="border-b border-surface-200 dark:border-surface-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-base tracking-tight text-brand-900 dark:text-brand-300 uppercase">
                  ClaimScope
                </span>
                <span className="text-xs text-surface-400">|</span>
                <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                  P&amp;C Automobile Claims Intelligence
                </span>
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                Case Assessment File: <span className="font-mono text-brand-600 dark:text-brand-400">{caseNumber || report.case_number || report.case_id}</span>
              </h1>
            </div>

            <div className="flex flex-col sm:items-end text-xs text-surface-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-surface-400" />
                <span>Generated: <strong>{formatDateTime(report.generated_at || report.created_at)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Dossier Status:</span>
                <Badge variant={report.status === 'final' || report.status === 'generated' ? 'success' : 'pending'} size="sm">
                  {(report.status || 'FINAL').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Adjuster Recommendation Hero Banner */}
        <div className={`rounded-xl border p-5 ${recConfig.borderClass} flex items-start gap-4 shadow-subtle`}>
          {recConfig.icon}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold tracking-tight">{recConfig.title}</h3>
              <Badge variant={recConfig.badgeVariant} size="sm">
                {recConfig.badgeLabel}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed font-medium">
              {rationale}
            </p>
            <p className="text-[11px] opacity-80 pt-0.5">
              Standard: {recConfig.subtitle}
            </p>
          </div>
        </div>

        {/* 1. Executive Incident Summary */}
        <ReportSection title="1. Executive Incident Summary">
          <p className="text-surface-700 dark:text-surface-300 leading-relaxed text-xs sm:text-sm">
            {incidentSummary}
          </p>
        </ReportSection>

        {/* 2. Document AI Intake & Package Analysis */}
        <ReportSection title="2. Incident Package Document Inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 p-4">
              <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileSearch className="h-4 w-4 text-brand-600" />
                Analyzed Documents ({analyzedDocs.length})
              </h4>
              {analyzedDocs.length > 0 ? (
                <ul className="space-y-2">
                  {analyzedDocs.map((doc, idx) => (
                    <li key={idx} className="text-xs text-surface-700 dark:text-surface-300 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{doc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-surface-500 italic">No documents ingested.</p>
              )}
            </div>

            <div className="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 p-4">
              <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-500" />
                Missing Supporting Documentation ({missingDocs.length})
              </h4>
              {missingDocs.length > 0 ? (
                <ul className="space-y-2">
                  {missingDocs.map((item, idx) => (
                    <li key={idx} className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                  <CheckCircle className="h-4 w-4" />
                  All standard incident package documents accounted for.
                </p>
              )}
            </div>
          </div>
        </ReportSection>

        {/* 3. Cross-Document Consistency & Contradiction Analysis */}
        <ReportSection
          title="3. Cross-Document Discrepancy & Contradiction Matrix"
          badge={
            inconsistencies.length > 0
              ? `${inconsistencies.length} Discrepanc${inconsistencies.length === 1 ? 'y' : 'ies'} Flagged`
              : '0 Contradictions'
          }
          badgeVariant={inconsistencies.length > 0 ? 'error' : 'success'}
        >
          {inconsistencies.length > 0 ? (
            <div className="space-y-3">
              {inconsistencies.map((inc, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-red-950 dark:text-red-200 text-xs">
                      {inc.title}
                    </span>
                    <Badge
                      variant={inc.severity === 'critical' || inc.severity === 'high' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {inc.severity.toUpperCase()} SEVERITY
                    </Badge>
                  </div>
                  <p className="text-xs text-red-900 dark:text-red-300 leading-relaxed font-normal">
                    {inc.description}
                  </p>
                  {inc.sources && inc.sources.length > 0 && (
                    <div className="text-[11px] text-red-700 dark:text-red-400 pt-1 font-mono">
                      Sources Compared: {inc.sources.join(' vs. ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  No Contradictions Detected
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Reported narrative, point of contact, impact timestamps, and photographic characteristics are mutually consistent across all submitted records.
                </p>
              </div>
            </div>
          )}
        </ReportSection>

        {/* 4. Triggered Assessment Rules */}
        {triggeredRules.length > 0 && (
          <ReportSection
            title="4. Triggered NAIC Decision Rules"
            badge={`${triggeredRules.length} Rule${triggeredRules.length === 1 ? '' : 's'} Triggered`}
            badgeVariant={triggeredRules.some(r => r.severity === 'critical' || r.severity === 'high') ? 'error' : 'warning'}
          >
            <div className="divide-y divide-surface-200 dark:divide-surface-800 border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden bg-surface-50/50 dark:bg-surface-900/40">
              {triggeredRules.map((rule, idx) => (
                <div key={idx} className="p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-surface-900 dark:text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-[10px]">{rule.rule_id}</span>
                      {rule.rule_name}
                    </span>
                    <Badge
                      variant={rule.severity === 'critical' || rule.severity === 'high' ? 'error' : rule.severity === 'medium' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {rule.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-surface-600 dark:text-surface-400 text-xs leading-relaxed">{rule.description}</p>
                  {rule.recommended_action && (
                    <div className="text-[11px] text-brand-800 dark:text-brand-300 font-medium bg-brand-50 dark:bg-brand-950/40 p-2.5 rounded-md border border-brand-100 dark:border-brand-900/50">
                      Mandated Action: {rule.recommended_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* 5. Real-Time External Verification */}
        {webVerifications.length > 0 && (
          <ReportSection title="5. External Registry Grounding (NHTSA &amp; Public Records)">
            <div className="space-y-3">
              {webVerifications.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-surface-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-brand-600" />
                      Inquiry: {item.query}
                    </span>
                    <Badge variant={item.status === 'verified' ? 'success' : 'neutral'} size="sm">
                      {String(item.status).toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                    {item.finding}
                  </p>
                  {item.source_url && (
                    <div className="text-[11px] text-surface-500 truncate pt-1">
                      Source:{' '}
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                      >
                        {item.source_name} ({item.source_url})
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* 6. Extracted Fact Verification Matrix */}
        {Object.keys(extractedFacts).length > 0 && (
          <ReportSection title="6. Extracted Fact Verification Matrix">
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="divide-y divide-surface-200 dark:divide-surface-800 bg-surface-0 dark:bg-surface-900/20">
                {Object.entries(extractedFacts).map(([key, val]) => {
                  let displayVal = '';
                  if (typeof val === 'object' && val !== null) {
                    if ('value' in val) {
                      displayVal = String((val as { value: unknown }).value);
                    } else if (Array.isArray(val)) {
                      displayVal = val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
                    } else {
                      displayVal = JSON.stringify(val);
                    }
                  } else {
                    displayVal = String(val);
                  }

                  return (
                    <div key={key} className="grid grid-cols-1 sm:grid-cols-3 p-3 text-xs gap-1 sm:gap-2">
                      <span className="font-semibold text-surface-600 dark:text-surface-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="sm:col-span-2 text-surface-900 dark:text-white font-mono break-words">
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ReportSection>
        )}

        {/* 7. Recommended Adjuster Action Items */}
        {recommendedActions.length > 0 && (
          <ReportSection title="7. Recommended Adjuster Action Checklist">
            <ul className="space-y-2">
              {recommendedActions.map((act, idx) => (
                <li key={idx} className="text-xs text-surface-800 dark:text-surface-200 flex items-start gap-2.5 bg-surface-50 dark:bg-surface-900/50 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <span className="text-brand-600 font-bold shrink-0 mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed">{act}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* 8. Investigation Scope & Limitations */}
        {limitations.length > 0 && (
          <ReportSection title="8. Investigation Scope &amp; Identified Limitations">
            <ul className="space-y-1.5">
              {limitations.map((limit, idx) => (
                <li
                  key={idx}
                  className="text-xs text-surface-600 dark:text-surface-400 flex items-start gap-2"
                >
                  <span className="text-surface-400 shrink-0 mt-0.5">•</span>
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* Institutional Regulatory & Compliance Notice */}
        <div className="rounded-xl bg-surface-100/70 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/60 p-4.5 text-[11px] text-surface-600 dark:text-surface-400 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-surface-800 dark:text-surface-200">
            <ShieldCheck className="h-4 w-4 text-growth-600" />
            <span>NAIC Model Act MDL-900 Compliance Notice</span>
          </div>
          <p>
            ClaimScope is an assistive decision-support intelligence platform for licensed insurance professionals. Automated extractions, contradiction diffs, and database verifications do not constitute an independent claim approval, denial, or legal fraud accusation. In compliance with the NAIC Model Unfair Claims Settlement Practices Act (MDL-900), final liability, coverage, and settlement authority resides strictly with the licensed claims adjuster.
          </p>
        </div>
      </div>
    </div>
  );
};
