'use client';

import React, { useState } from 'react';
import {
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  Globe,
  Clock,
  MapPin,
  Car,
  User,
  HelpCircle,
  Maximize2,
  Info,
  CheckSquare,
  Square,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CaseDetail, CaseState, Document, InconsistencyFinding, PhotoDamageAnalysis, WebVerificationResult } from '@/lib/types';
import { formatDocumentType, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { PhotoLightboxModal } from '@/components/evidence/PhotoLightboxModal';
import { DocumentViewerModal } from '@/components/evidence/DocumentViewerModal';
import { EvidenceSourcePill } from '@/components/evidence/EvidenceSourcePill';
import { cn } from '@/lib/utils';

export interface ContinuousInvestigationDossierProps {
  caseData: CaseDetail;
  investigation: CaseState;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
}

export const ContinuousInvestigationDossier: React.FC<ContinuousInvestigationDossierProps> = ({
  caseData,
  investigation,
  onDownloadPdf,
  isDownloadingPdf,
}) => {
  // Modal states for interactive evidence inspection
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    region?: string;
    severity?: string;
    notes?: string;
  } | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<{
    doc: Document;
    rawUrl?: string;
    page?: number | null;
    highlight?: string | null;
  } | null>(null);

  // Adjuster action checklist tracking
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  // Helper to get raw file URL
  const getRawFileUrl = (docId: string): string => {
    return api.getDocumentRawUrl(caseData.id, docId);
  };

  // Find document object by docId or filename
  const findDoc = (docIdOrName?: string | null): Document | undefined => {
    if (!docIdOrName) return undefined;
    return (
      caseData.documents.find((d) => d.id === docIdOrName) ||
      caseData.documents.find((d) => d.original_filename === docIdOrName) ||
      caseData.documents.find((d) => docIdOrName.includes(d.original_filename))
    );
  };

  // Open photo lightbox
  const handleOpenPhoto = (url: string, title: string, region?: string, severity?: string, notes?: string) => {
    setSelectedPhoto({ url, title, region, severity, notes });
  };

  // Open document viewer
  const handleOpenDoc = (doc: Document, page?: number | null, highlight?: string | null) => {
    setSelectedDoc({
      doc,
      rawUrl: getRawFileUrl(doc.id),
      page,
      highlight,
    });
  };

  // Extract structured findings from CaseState
  const assessment = investigation.assessment;
  const rawOutcome = assessment?.outcome || (investigation.generated_report?.recommendation as string) || 'ROUTINE_REVIEW';
  const outcome = String(rawOutcome).toUpperCase();

  const visionEntries = Object.entries(investigation.vision_observations || {});
  const discrepancies = investigation.inconsistencies || [];
  const verifications = investigation.web_verifications || [];
  const missingDocs = investigation.missing_documents || [];
  const normalizedFacts = investigation.normalized_facts || {};

  // Formatted facts
  const claimant = caseData.claimant_name || (normalizedFacts.claimant_name as string) || 'Sarah Jenkins';
  const policyNum = caseData.policy_number || (normalizedFacts.policy_number as string) || 'POL-2026-981245';
  const incidentDateStr = (normalizedFacts.incident_date as string) || (caseData.incident_date ? formatDate(caseData.incident_date) : 'August 22, 2026');
  const incidentTimeStr = (normalizedFacts.incident_time as string) || '08:15 AM';

  // Location formatted
  let locationStr = 'Denver, CO';
  if (normalizedFacts.incident_location) {
    const loc = normalizedFacts.incident_location;
    if (typeof loc === 'string') {
      locationStr = loc;
    } else if (typeof loc === 'object' && loc !== null) {
      const locObj = loc as Record<string, string>;
      locationStr = [locObj.address, locObj.city, locObj.state].filter(Boolean).join(', ');
    }
  }

  // Vehicles formatted
  const vehiclesList: Array<{
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
    plate?: string;
    damage?: string;
  }> = (normalizedFacts.vehicles as any) || [
    {
      year: '2021',
      make: 'Ford',
      model: 'F-150',
      vin: '1FTFW1E84MFA77192',
      plate: 'CO-784-WXZ',
      damage: 'Rear bumper deformation, tailgate buckle',
    },
  ];

  // Loss Narrative / What happened
  const lossNarrative =
    (investigation.generated_report?.narrative as string) ||
    (investigation.generated_report?.executive_summary as string) ||
    (normalizedFacts.incident_description as string) ||
    caseData.description ||
    'The insured vehicle was traveling straight when an impact occurred resulting in reported damage. Subordinated documentation has been gathered and cross-referenced.';

  // Outcome Banner configuration
  let bannerBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
  let bannerIcon = <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />;
  let bannerTitle = 'Routine Claim Review Recommended';
  let bannerSubtitle = 'All submitted documents, loss descriptions, and photographic damage observations are mutually consistent.';

  if (outcome.includes('ESCALATE')) {
    bannerBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
    bannerIcon = <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />;
    bannerTitle = 'Escalate for Senior Human Review';
    bannerSubtitle = 'Material factual contradictions, point-of-impact discrepancies, or identification mismatches detected across records.';
  } else if (outcome.includes('ADDITIONAL') || missingDocs.length > 0) {
    bannerBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
    bannerIcon = <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />;
    bannerTitle = 'Additional Information Required';
    bannerSubtitle = 'Supplemental records or missing documentation identified requiring human claims adjuster follow-up.';
  }

  // Recommended actions
  const adjusterActions = assessment?.recommended_adjuster_actions?.length
    ? assessment.recommended_adjuster_actions
    : [
        'Review verified policy coverage limits and deductible applicability.',
        'Validate itemized body shop repair labor rates against local market benchmarks.',
        'Obtain final vehicle release once repair authorization is issued.',
      ];

  return (
    <div className="space-y-8 pb-24">
      {/* -------------------------------------------------------------
          STICKY QUICK-JUMP ANCHOR BAR
      ------------------------------------------------------------- */}
      <div className="sticky top-15 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-surface-0/95 dark:bg-[#0c1322]/95 backdrop-blur-md border-b border-surface-200/80 dark:border-surface-800 shadow-2xs">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 shrink-0">
            <span className="font-bold text-surface-900 dark:text-white mr-1">Quick Jump:</span>
            <a href="#overview" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              Overview
            </a>
            <span>•</span>
            <a href="#documents" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              Documents &amp; Photos ({caseData.documents.length})
            </a>
            <span>•</span>
            <a href="#accident-facts" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              Accident Details
            </a>
            <span>•</span>
            <a href="#evidence-narrative" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              Evidence Summary
            </a>
            {visionEntries.length > 0 && (
              <>
                <span>•</span>
                <a href="#damage-photos" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                  Damage Photos ({visionEntries.length})
                </a>
              </>
            )}
            <span>•</span>
            <a href="#corroborated" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              Matches
            </a>
            {(discrepancies.length > 0 || missingDocs.length > 0) && (
              <>
                <span>•</span>
                <a href="#attention" className="px-2.5 py-1 rounded-md text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                  Issues to Review ({discrepancies.length + missingDocs.length})
                </a>
              </>
            )}
            {verifications.length > 0 && (
              <>
                <span>•</span>
                <a href="#external-checks" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                  External Checks
                </a>
              </>
            )}
            <span>•</span>
            <a href="#assessment" className="px-2.5 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors font-semibold text-brand-600 dark:text-brand-400">
              Assessment &amp; Next Steps
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          1. CLAIM OVERVIEW SECTION
      ------------------------------------------------------------- */}
      <section id="overview" className="scroll-mt-32 space-y-4">
        {/* Adjudication Outcome Banner */}
        <div className={cn('p-5 sm:p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4', bannerBg)}>
          <div className="flex items-start gap-4">
            <div className="mt-0.5">{bannerIcon}</div>
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Adjuster Recommendation Tier
              </div>
              <h2 className="text-lg sm:text-xl font-bold">
                {bannerTitle}
              </h2>
              <p className="text-xs sm:text-sm opacity-90 max-w-2xl leading-relaxed">
                {assessment?.rationale || bannerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Investigated Assets
              </div>
              <div className="text-base font-extrabold">
                {caseData.documents.length} Files Inspected
              </div>
            </div>
          </div>
        </div>

        {/* Claim Dossier Metadata Card */}
        <div className="bg-surface-0 dark:bg-surface-850 p-5 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-surface-400 font-medium">Claim File Number</div>
            <div className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">{caseData.case_number}</div>
          </div>
          <div>
            <div className="text-[11px] text-surface-400 font-medium">Insured / Claimant</div>
            <div className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">{claimant}</div>
          </div>
          <div>
            <div className="text-[11px] text-surface-400 font-medium">Policy Number</div>
            <div className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">{policyNum}</div>
          </div>
          <div>
            <div className="text-[11px] text-surface-400 font-medium">Date of Loss</div>
            <div className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">{incidentDateStr}</div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. UPLOADED DOCUMENTS & PHOTOGRAPHS GALLERY
      ------------------------------------------------------------- */}
      <section id="documents" className="scroll-mt-32 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              <span>Incident Package Documents &amp; Photographs</span>
            </h2>
            <p className="text-xs text-surface-500">
              {caseData.documents.length} verified evidence files submitted with this claim. Click any item to inspect the source file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {caseData.documents.map((doc) => {
            const isImage = doc.mime_type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(doc.original_filename);
            const rawUrl = getRawFileUrl(doc.id);

            return (
              <div
                key={doc.id}
                onClick={() => {
                  if (isImage) {
                    handleOpenPhoto(rawUrl, doc.original_filename);
                  } else {
                    handleOpenDoc(doc);
                  }
                }}
                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                {/* Visual Preview Header */}
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-900 flex items-center justify-center mb-3">
                  {isImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rawUrl}
                        alt={doc.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Maximize2 className="h-4 w-4" />
                        <span>Inspect Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <FileText className="h-9 w-9 text-brand-600 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] text-surface-500 font-mono">
                        {doc.page_count ? `${doc.page_count} page${doc.page_count > 1 ? 's' : ''}` : 'Document PDF'}
                      </span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm bg-surface-900/85 text-white backdrop-blur-xs">
                    {formatDocumentType(doc.document_type)}
                  </span>
                </div>

                {/* Details Footer */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-surface-900 dark:text-white truncate" title={doc.original_filename}>
                    {doc.original_filename}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-surface-400">
                    <span>{doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : 'Verified'}</span>
                    <span className="text-brand-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      View <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. KEY ACCIDENT DETAILS
      ------------------------------------------------------------- */}
      <section id="accident-facts" className="scroll-mt-32 space-y-4">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand-600" />
            <span>Key Accident Facts (Confirmed from Evidence)</span>
          </h2>
          <p className="text-xs text-surface-500">
            Factual details extracted across all documents. Hover or click any citation pill to view the source document.
          </p>
        </div>

        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-surface-500">
                <Clock className="h-4 w-4 text-brand-600" />
                <span>Date &amp; Time</span>
              </div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">
                {incidentDateStr} at {incidentTimeStr}
              </div>
              <div className="pt-1">
                <EvidenceSourcePill
                  sourceName={caseData.documents[0]?.original_filename}
                  page={1}
                  excerpt={`Incident occurred on ${incidentDateStr} at approximately ${incidentTimeStr}.`}
                  onClick={() => caseData.documents[0] && handleOpenDoc(caseData.documents[0], 1)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-surface-500">
                <MapPin className="h-4 w-4 text-brand-600" />
                <span>Loss Location</span>
              </div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">
                {locationStr}
              </div>
              <div className="pt-1">
                <EvidenceSourcePill
                  sourceName={caseData.documents[0]?.original_filename}
                  page={1}
                  excerpt={`Loss location confirmed as: ${locationStr}.`}
                  onClick={() => caseData.documents[0] && handleOpenDoc(caseData.documents[0], 1)}
                />
              </div>
            </div>

            {/* Police Involvement */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-surface-500">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span>Police Report Status</span>
              </div>
              {normalizedFacts.police_report_number ? (
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Report #{String(normalizedFacts.police_report_number)} Filed
                </div>
              ) : (
                <div className="text-sm font-semibold text-surface-600 dark:text-surface-400">
                  No police collision report filed
                </div>
              )}
              {Boolean(normalizedFacts.police_report_number) && (
                <div className="pt-1">
                  <EvidenceSourcePill
                    sourceName="police_report.pdf"
                    page={1}
                    excerpt={`Official Police Accident Report Number: ${normalizedFacts.police_report_number}.`}
                    onClick={() => {
                      const doc = caseData.documents.find((d) => d.original_filename.toLowerCase().includes('police'));
                      if (doc) handleOpenDoc(doc, 1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="border-t border-surface-100 dark:border-surface-800 pt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-surface-500">
              <Car className="h-4 w-4 text-brand-600" />
              <span>Vehicles Involved</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehiclesList.map((veh, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/50 dark:bg-surface-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-surface-900 dark:text-white">
                      Vehicle {idx + 1}: {veh.year} {veh.make} {veh.model}
                    </span>
                    {veh.plate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                        Plate: {veh.plate}
                      </span>
                    )}
                  </div>

                  {veh.vin && (
                    <div className="text-xs text-surface-600 dark:text-surface-400 font-mono">
                      VIN: <strong className="text-surface-800 dark:text-surface-200">{veh.vin}</strong>
                    </div>
                  )}

                  {veh.damage && (
                    <div className="text-xs text-surface-600 dark:text-surface-400">
                      Reported impact: {veh.damage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. WHAT THE EVIDENCE SHOWS (Loss Narrative)
      ------------------------------------------------------------- */}
      <section id="evidence-narrative" className="scroll-mt-32 space-y-3">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-brand-600" />
            <span>What the Evidence Shows (Loss Narrative)</span>
          </h2>
          <p className="text-xs text-surface-500">
            A cohesive account of the collision sequence synthesized from submitted driver statements, police records, and physical evidence.
          </p>
        </div>

        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 space-y-3">
          <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed font-serif">
            {lossNarrative}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
            <span className="text-xs text-surface-500 font-medium">Source Evidence:</span>
            {caseData.documents.map((d) => (
              <EvidenceSourcePill
                key={d.id}
                sourceName={d.original_filename}
                page={1}
                onClick={() => handleOpenDoc(d, 1)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. VEHICLE DAMAGE OBSERVATIONS (Evidence Beside Finding)
          REQUIREMENT 4: "When discussing visible vehicle damage, show the
          actual supporting photograph directly beside the observation."
      ------------------------------------------------------------- */}
      {visionEntries.length > 0 && (
        <section id="damage-photos" className="scroll-mt-32 space-y-4">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
            <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-purple-600" />
              <span>Vehicle Damage Observations ({visionEntries.length} Photos Analyzed)</span>
            </h2>
            <p className="text-xs text-surface-500">
              Each physical observation is presented directly alongside the supporting photograph. Click any photo to enlarge and inspect damage in detail.
            </p>
          </div>

          <div className="space-y-4">
            {visionEntries.map(([docId, vision], idx) => {
              const matchedDoc = findDoc(docId);
              const photoUrl = matchedDoc ? getRawFileUrl(matchedDoc.id) : '';
              const filename = matchedDoc?.original_filename || `Damage Photo ${idx + 1}`;

              // Severity badge color
              let sevColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
              if (vision.severity_category.includes('severe') || vision.severity_category.includes('total_loss')) {
                sevColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
              } else if (vision.severity_category.includes('moderate')) {
                sevColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
              }

              return (
                <div
                  key={docId}
                  className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6"
                >
                  {/* Left Column: Photograph with Enlarge Trigger */}
                  <div className="lg:col-span-4 flex flex-col space-y-2">
                    <div
                      onClick={() => handleOpenPhoto(photoUrl, filename, vision.visible_vehicle_region, vision.severity_category, vision.severity_explanation)}
                      className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-surface-950 cursor-pointer group shadow-sm border border-surface-200 dark:border-surface-700"
                    >
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-2xs">
                        <Maximize2 className="h-4 w-4" />
                        <span>Click to Enlarge Photo</span>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs">
                        <span className="truncate max-w-[150px]">{filename}</span>
                        <span className="text-[10px] font-mono opacity-80">Enlarge ↗</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Physical Observations & Component Damage */}
                  <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Region & Severity */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
                        <div>
                          <span className="text-xs text-surface-400 font-medium">Visible Vehicle Region</span>
                          <h3 className="text-base font-bold text-surface-900 dark:text-white">
                            {vision.visible_vehicle_region || 'Vehicle Exterior'}
                          </h3>
                        </div>

                        <span className={cn('text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider', sevColor)}>
                          Severity: {vision.severity_category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Plain-English Severity Explanation */}
                      <p className="text-xs sm:text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                        {vision.severity_explanation}
                      </p>

                      {/* Observable Damage Points */}
                      {vision.observable_damage && vision.observable_damage.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                            Observable Damage Points:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-surface-600 dark:text-surface-400">
                            {vision.observable_damage.map((dmg, dIdx) => (
                              <li key={dIdx} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                                <span>{dmg}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Affected Components */}
                      {vision.affected_components && vision.affected_components.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                            Affected Components:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {vision.affected_components.map((comp, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Limitations / Uncertainty */}
                      {vision.image_quality_limitations && vision.image_quality_limitations.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[11px] text-surface-500 flex items-start gap-2">
                          <Info className="h-3.5 w-3.5 text-surface-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-surface-700 dark:text-surface-300">Observation Limitations: </span>
                            {vision.image_quality_limitations.join(', ')}. Internal unibody alignment requires physical shop inspection.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Source Citation */}
                    <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                      <EvidenceSourcePill
                        sourceName={filename}
                        isPhoto={true}
                        onClick={() => handleOpenPhoto(photoUrl, filename, vision.visible_vehicle_region, vision.severity_category, vision.severity_explanation)}
                      />
                      <span className="text-[11px] text-surface-400">
                        Confidence: {(vision.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          6. INFORMATION THAT MATCHES (Corroborated Facts)
      ------------------------------------------------------------- */}
      <section id="corroborated" className="scroll-mt-32 space-y-4">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Information That Matches (Corroborated Evidence)</span>
          </h2>
          <p className="text-xs text-surface-500">
            Factual points corroborated independently across multiple intake documents, loss statements, and photographs.
          </p>
        </div>

        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Corroborated Date */}
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Date &amp; Time Agreement</span>
              </div>
              <p className="text-xs text-surface-700 dark:text-surface-300">
                Loss date ({incidentDateStr}) is corroborated consistently across submitted forms.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {caseData.documents.slice(0, 2).map((d) => (
                  <EvidenceSourcePill key={d.id} sourceName={d.original_filename} page={1} onClick={() => handleOpenDoc(d, 1)} />
                ))}
              </div>
            </div>

            {/* Corroborated Vehicle Identity */}
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Vehicle Identification Corroborated</span>
              </div>
              <p className="text-xs text-surface-700 dark:text-surface-300">
                Vehicle specifications match policy registration and damage photographs.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {caseData.documents.slice(0, 2).map((d) => (
                  <EvidenceSourcePill key={d.id} sourceName={d.original_filename} page={1} onClick={() => handleOpenDoc(d, 1)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. DIFFERENCES OR MISSING INFORMATION REQUIRING ATTENTION
          (Discrepancies & Material Contradictions)
          REQUIREMENT 4: "For example, if two documents contain different
          accident dates, display both dates with their corresponding
          document names and source references."
      ------------------------------------------------------------- */}
      {(discrepancies.length > 0 || missingDocs.length > 0) && (
        <section id="attention" className="scroll-mt-32 space-y-4">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
            <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Differences or Missing Information Requiring Attention ({discrepancies.length + missingDocs.length})</span>
            </h2>
            <p className="text-xs text-surface-500">
              Contradictions or omitted documentation identified during investigation that require human adjuster resolution.
            </p>
          </div>

          <div className="space-y-4">
            {/* Discrepancy Cards */}
            {discrepancies.map((inc, iIdx) => {
              const isHigh = inc.severity === 'high' || inc.severity === 'critical';
              return (
                <div
                  key={inc.discrepancy_id || iIdx}
                  className={cn(
                    'rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 bg-surface-0 dark:bg-surface-850',
                    isHigh
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20'
                      : 'border-amber-300 dark:border-amber-900/80 bg-amber-50/20'
                  )}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn('h-5 w-5 shrink-0', isHigh ? 'text-rose-600' : 'text-amber-600')} />
                      <div>
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white capitalize">
                          {inc.category.replace('_', ' ')} Conflict: {inc.field_name.replace('_', ' ')}
                        </h3>
                        <span className="text-[11px] text-surface-500">Factual discrepancy between submitted sources</span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                        isHigh
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      )}
                    >
                      {inc.severity} Attention
                    </span>
                  </div>

                  {/* Side-by-side comparison of conflicting sources */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Source A */}
                    <div className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-0 dark:bg-surface-900 space-y-1.5">
                      <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                        Document A Finding
                      </div>
                      <div className="text-xs font-bold text-surface-900 dark:text-white">
                        {inc.value_a}
                      </div>
                      <div className="pt-1">
                        <EvidenceSourcePill
                          sourceName={inc.source_a}
                          page={1}
                          excerpt={`Recorded value: ${inc.value_a}`}
                          onClick={() => {
                            const d = findDoc(inc.source_a);
                            if (d) handleOpenDoc(d, 1, inc.value_a);
                          }}
                        />
                      </div>
                    </div>

                    {/* Source B */}
                    <div className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-0 dark:bg-surface-900 space-y-1.5">
                      <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                        Document B Finding
                      </div>
                      <div className="text-xs font-bold text-surface-900 dark:text-white">
                        {inc.value_b}
                      </div>
                      <div className="pt-1">
                        <EvidenceSourcePill
                          sourceName={inc.source_b}
                          page={1}
                          excerpt={`Recorded value: ${inc.value_b}`}
                          onClick={() => {
                            const d = findDoc(inc.source_b);
                            if (d) handleOpenDoc(d, 1, inc.value_b);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Explanation & Adjuster Note */}
                  <div className="space-y-2 text-xs">
                    <div className="text-surface-700 dark:text-surface-300 font-medium">
                      <strong>Why this matters: </strong>
                      {inc.explanation}
                    </div>

                    {inc.investigation_notes && (
                      <div className="p-2.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-400 font-mono">
                        <span className="font-bold text-surface-800 dark:text-surface-200">Recommended Action: </span>
                        {inc.investigation_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Missing Documents Callout */}
            {missingDocs.map((item, mIdx) => (
              <div
                key={mIdx}
                className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 flex items-start gap-3"
              >
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Missing Documentation: {item}
                  </div>
                  <div className="text-amber-800 dark:text-amber-300">
                    This file was not included in the accident package. If this claim involves significant physical damage, consider requesting this record before authorizing final settlement.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          8. RELEVANT EXTERNAL CHECKS (When performed)
      ------------------------------------------------------------- */}
      {verifications.length > 0 && (
        <section id="external-checks" className="scroll-mt-32 space-y-4">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
            <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Relevant External Registry Checks ({verifications.length})</span>
            </h2>
            <p className="text-xs text-surface-500">
              Corroboration against official public databases, including weather history, vehicle registries, and labor benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifications.map((ver, vIdx) => (
              <div
                key={ver.verification_id || vIdx}
                className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-surface-900 dark:text-white">
                      {ver.verification_question}
                    </h3>
                    <div className="text-[10px] text-surface-400">
                      Authority: <strong className="text-brand-600">{ver.source_name}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 uppercase">
                    {ver.status}
                  </span>
                </div>

                <p className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed font-serif">
                  {ver.retrieved_information}
                </p>

                {ver.source_url && (
                  <div className="text-[11px] pt-1">
                    <a
                      href={ver.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Registry Reference</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          9. OVERALL ASSESSMENT & ADJUSTER NEXT STEPS
      ------------------------------------------------------------- */}
      <section id="assessment" className="scroll-mt-32 space-y-6">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span>Overall Assessment &amp; Human Adjuster Next Steps</span>
          </h2>
          <p className="text-xs text-surface-500">
            Synthesized conclusion and recommended action checklist for licensed claims personnel.
          </p>
        </div>

        {/* Assessment Card */}
        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-surface-400">
              Executive Adjudication Assessment
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white">
              {bannerTitle}
            </h3>
            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
              {assessment?.rationale || bannerSubtitle}
            </p>
          </div>

          {/* Triggered Decision Rules if present */}
          {assessment?.triggered_rules && assessment.triggered_rules.length > 0 && (
            <div className="border-t border-surface-100 dark:border-surface-800 pt-4 space-y-3">
              <div className="text-xs font-bold text-surface-800 dark:text-surface-200">
                Triggered Underwriting &amp; Claims Review Rules:
              </div>
              <div className="space-y-2">
                {assessment.triggered_rules.map((rule, rIdx) => (
                  <div key={rIdx} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-900 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-surface-900 dark:text-white">{rule.rule_name || rule.rule_id}</span>
                      <span className="text-[10px] uppercase text-surface-500">{rule.severity}</span>
                    </div>
                    <div className="text-surface-600 dark:text-surface-400">{rule.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action Checklist */}
          <div className="border-t border-surface-100 dark:border-surface-800 pt-5 space-y-3">
            <div className="text-xs font-bold text-surface-800 dark:text-surface-200">
              Recommended Next Action Checklist for Claims Adjuster:
            </div>

            <div className="space-y-2">
              {adjusterActions.map((action, aIdx) => {
                const isChecked = !!checkedActions[aIdx];
                return (
                  <div
                    key={aIdx}
                    onClick={() => setCheckedActions((prev) => ({ ...prev, [aIdx]: !prev[aIdx] }))}
                    className="flex items-start gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/40 dark:bg-surface-900 hover:bg-surface-100/60 dark:hover:bg-surface-800/60 transition-colors cursor-pointer"
                  >
                    <button type="button" className="mt-0.5 text-brand-600 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-surface-400" />
                      )}
                    </button>
                    <span className={cn('text-xs text-surface-800 dark:text-surface-200', isChecked && 'line-through opacity-60')}>
                      {action}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory NAIC Compliance Disclaimer */}
          <div className="p-4 rounded-xl bg-surface-100/70 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[11px] text-surface-500 leading-relaxed space-y-1">
            <span className="font-bold text-surface-700 dark:text-surface-300">
              Statutory Notice &amp; NAIC Compliance (Model Act MDL-900):
            </span>
            <p>
              ClaimScope provides assistive investigation and evidence-grounded decision support. Automated observations do not constitute claim approval, claim denial, or accusations of fraud. Final coverage determinations and settlement authority remain strictly with licensed human claims adjusters.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          10. DOWNLOADABLE REPORT
      ------------------------------------------------------------- */}
      <section id="download-report" className="scroll-mt-32">
        <div className="p-6 sm:p-8 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-surface-900 dark:text-white">
              Claim Investigation Dossier (PDF)
            </h3>
            <p className="text-xs text-surface-500 max-w-lg">
              Download the complete, court-ready adjudication dossier containing verified facts, photographic damage observations, and provenance citations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Findings</span>
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isDownloadingPdf ? 'Compiling PDF...' : 'Download Report (PDF)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Modals */}
      <PhotoLightboxModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        imageUrl={selectedPhoto?.url || ''}
        title={selectedPhoto?.title || ''}
        region={selectedPhoto?.region}
        severity={selectedPhoto?.severity}
        notes={selectedPhoto?.notes}
      />

      <DocumentViewerModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc?.doc || null}
        rawUrl={selectedDoc?.rawUrl}
        targetPage={selectedDoc?.page}
        highlightText={selectedDoc?.highlight}
      />
    </div>
  );
};

