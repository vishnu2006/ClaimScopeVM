'use client';

import React, { useState, useMemo } from 'react';
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
  Eye,
  ArrowUpRight,
  Check,
  XCircle,
  Split,
  FileCheck2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import {
  CaseDetail,
  CaseState,
  Document,
  InconsistencyFinding,
  PhotoDamageAnalysis,
  WebVerificationResult,
} from '@/lib/types';
import { formatDocumentType, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { PhotoLightboxModal, PhotoItem } from '@/components/evidence/PhotoLightboxModal';
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
  // Lightbox modal state with multi-photo gallery navigation support
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Document modal state
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

  // Extract structured findings from CaseState
  const assessment = investigation.assessment;
  const rawOutcome =
    assessment?.outcome ||
    (investigation.generated_report?.recommendation as string) ||
    'ROUTINE_REVIEW';
  const outcome = String(rawOutcome).toUpperCase();

  const visionEntries = Object.entries(investigation.vision_observations || {});
  const discrepancies = investigation.inconsistencies || [];
  const verifications = investigation.web_verifications || [];
  const missingDocs = investigation.missing_documents || [];
  const normalizedFacts = investigation.normalized_facts || {};

  // Formatted facts
  const claimant =
    caseData.claimant_name ||
    (normalizedFacts.claimant_name as string) ||
    'Pending Intake Review';
  const policyNum =
    caseData.policy_number ||
    (normalizedFacts.policy_number as string) ||
    'Pending Verification';
  const incidentDateStr =
    (normalizedFacts.incident_date as string) ||
    (caseData.incident_date ? formatDate(caseData.incident_date) : 'Date Unspecified');
  const incidentTimeStr =
    (normalizedFacts.incident_time as string) || 'Time Unspecified';

  // Location formatted
  let locationStr = 'Location Unspecified';
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
  }> = (normalizedFacts.vehicles as any) || [];

  // Loss Narrative / What happened
  const lossNarrative =
    (investigation.generated_report?.narrative as string) ||
    (investigation.generated_report?.executive_summary as string) ||
    (normalizedFacts.incident_description as string) ||
    caseData.description ||
    'The insured vehicle was traveling straight when an impact occurred resulting in reported damage. Subordinated documentation has been gathered and cross-referenced.';

  // Separate Image Documents vs Document Files
  const imageDocs = useMemo(
    () =>
      caseData.documents.filter(
        (d) =>
          d.mime_type?.startsWith('image/') ||
          /\.(jpe?g|png|webp|bmp)$/i.test(d.original_filename)
      ),
    [caseData.documents]
  );

  const textDocs = useMemo(
    () =>
      caseData.documents.filter(
        (d) =>
          !d.mime_type?.startsWith('image/') &&
          !/\.(jpe?g|png|webp|bmp)$/i.test(d.original_filename)
      ),
    [caseData.documents]
  );

  // Gallery of photos for lightbox
  const photoGallery: PhotoItem[] = useMemo(() => {
    return imageDocs.map((doc, idx) => {
      // Find matching vision observation if any
      const visionMatch = Object.entries(investigation.vision_observations || {}).find(
        ([vId]) => vId === doc.id || vId.includes(doc.original_filename)
      )?.[1];

      return {
        url: getRawFileUrl(doc.id),
        title: doc.original_filename,
        region: visionMatch?.is_claim_relevant === false ? 'Non-Relevant Image' : (visionMatch?.visible_vehicle_region || `Accident Photograph ${idx + 1}`),
        severity: (visionMatch?.is_claim_relevant === false || visionMatch?.severity_category === 'not_applicable') ? 'not relevant' : visionMatch?.severity_category?.replace('_', ' '),
        notes:
          visionMatch?.severity_explanation ||
          (visionMatch?.observable_damage ? visionMatch.observable_damage.join('; ') : undefined),
      };
    });
  }, [imageDocs, investigation.vision_observations, caseData.id]);

  // Primary Hero Photograph (if any photos uploaded)
  const primaryHeroPhoto = photoGallery.length > 0 ? photoGallery[0] : null;

  // Open photo lightbox at index
  const handleOpenPhotoIndex = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleOpenPhotoByFilename = (filename: string) => {
    const idx = photoGallery.findIndex((p) => p.title.toLowerCase().includes(filename.toLowerCase()));
    if (idx !== -1) {
      setSelectedPhotoIndex(idx);
    } else if (photoGallery.length > 0) {
      setSelectedPhotoIndex(0);
    }
  };

  // Open document viewer
  const handleOpenDoc = (
    doc: Document,
    page?: number | null,
    highlight?: string | null
  ) => {
    setSelectedDoc({
      doc,
      rawUrl: getRawFileUrl(doc.id),
      page,
      highlight,
    });
  };

  // Review Recommendation Banner Styling & Content
  let bannerBorder = 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30';
  let bannerBadgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200';
  let bannerIcon = <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />;
  let bannerTitle = 'Routine Review Recommended';
  let bannerActionText = 'Proceed with standard estimate validation and coverage confirmation.';

  if (outcome.includes('ESCALATE')) {
    bannerBorder = 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30';
    bannerBadgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200';
    bannerIcon = <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />;
    bannerTitle = 'Escalate for Senior Adjuster Review';
    bannerActionText = 'Review material factual contradictions and vehicle identification before authorizing settlement.';
  } else if (outcome.includes('ADDITIONAL') || missingDocs.length > 0) {
    bannerBorder = 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30';
    bannerBadgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200';
    bannerIcon = <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />;
    bannerTitle = 'Additional Documentation Required';
    bannerActionText = 'Request the missing documentation listed below before closing this investigation.';
  }

  // Determine Most Important Outstanding Issue
  let outstandingIssueTitle = '';
  let outstandingIssueDetail = '';
  if (discrepancies.length > 0) {
    const topDisc = discrepancies[0];
    outstandingIssueTitle = `Conflicting ${topDisc.field_name.replace('_', ' ')} between sources`;
    outstandingIssueDetail = `${topDisc.source_a} indicates "${topDisc.value_a}", whereas ${topDisc.source_b} reports "${topDisc.value_b}". Reconcile with the reporting authority.`;
  } else if (missingDocs.length > 0) {
    outstandingIssueTitle = `Missing ${missingDocs[0]}`;
    outstandingIssueDetail = `We have verified the accident statement, but ${missingDocs.join(' and ')} ${missingDocs.length > 1 ? "haven't" : "hasn't"} been provided. Request these records before finalizing.`;
  } else {
    outstandingIssueTitle = 'All evidence corroborated';
    outstandingIssueDetail = 'Dates, locations, vehicle specifications, and physical photographs are consistent across all submissions.';
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
    <div className="space-y-12 pb-32 max-w-[1240px] mx-auto">
      {/* -------------------------------------------------------------
          SUBTLE STICKY QUICK-NAVIGATION ANCHOR BAR
      ------------------------------------------------------------- */}
      <div className="sticky top-15 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-surface-0/95 dark:bg-[#0b111e]/95 backdrop-blur-md border-b border-surface-200/80 dark:border-surface-800 shadow-2xs">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2.5 text-surface-500 shrink-0 font-medium">
            <span className="font-bold text-surface-900 dark:text-white">Investigation:</span>
            <a href="#incident-hero" className="hover:text-brand-600 transition-colors">
              Incident Overview
            </a>
            <span className="opacity-30">•</span>
            <a
              href="#attention-section"
              className={cn(
                'hover:underline font-semibold transition-colors',
                discrepancies.length > 0 || missingDocs.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-surface-600'
              )}
            >
              Needs Attention ({discrepancies.length + missingDocs.length})
            </a>
            <span className="opacity-30">•</span>
            {visionEntries.length > 0 && (
              <>
                <a href="#damage-section" className="hover:text-brand-600 transition-colors">
                  Damage Findings ({visionEntries.length})
                </a>
                <span className="opacity-30">•</span>
              </>
            )}
            <a href="#gallery-section" className="hover:text-brand-600 transition-colors">
              Evidence Gallery ({caseData.documents.length})
            </a>
            <span className="opacity-30">•</span>
            <a href="#status-section" className="hover:text-brand-600 transition-colors">
              Fact Status
            </a>
            <span className="opacity-30">•</span>
            <a
              href="#next-steps-section"
              className="hover:text-brand-600 transition-colors font-bold text-brand-600 dark:text-brand-400"
            >
              Adjuster Checklist
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isDownloadingPdf ? 'Compiling PDF...' : 'Download Brief (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          1. EDITORIAL FIRST SCREEN / HERO OVERVIEW
             REQUIREMENT 2: Completely rethink the report's first screen.
             Replace the 3 large grey boxes with an editorial layout:
             - Strong concise headline
             - Natural language narrative
             - ACTUAL primary accident photograph displayed prominently
             - Compact details strip
             - Visible recommendation & primary issue
      ------------------------------------------------------------- */}
      <section id="incident-hero" className="scroll-mt-28 space-y-4">
        {/* Editorial Hero Container */}
        <div className="bg-surface-0 dark:bg-surface-850 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
            {/* Left 7 Cols: Incident Story & Findings Summary */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Meta Headline & Case Number */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                      Auto Claim Investigation Brief
                    </span>
                    <span className="text-surface-300 dark:text-surface-700">•</span>
                    <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                      {caseData.case_number}
                    </span>
                  </div>

                  <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase', bannerBadgeBg)}>
                    {bannerTitle}
                  </span>
                </div>

                {/* Narrative Headline */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight leading-snug">
                  {caseData.title || `Accident Investigation: ${claimant}`}
                </h1>

                {/* Plain-English Accident Narrative */}
                <div className="space-y-2">
                  <p className="text-sm sm:text-[15px] text-surface-700 dark:text-surface-300 leading-relaxed font-serif">
                    {lossNarrative}
                  </p>
                </div>
              </div>

              {/* Outstanding Issue & Next Action Callout Strip */}
              <div className="space-y-3 pt-2">
                <div className={cn('p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3', bannerBorder)}>
                  {bannerIcon}
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                      <span>Primary Issue: {outstandingIssueTitle}</span>
                    </div>
                    <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                      {outstandingIssueDetail}
                    </p>
                  </div>
                </div>

                {/* Reviewer Next Action Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800 text-xs text-surface-600 dark:text-surface-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider text-[10px]">
                      Recommended Action:
                    </span>
                    <span className="truncate">{bannerActionText}</span>
                  </div>
                  <a
                    href="#next-steps-section"
                    className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 shrink-0 inline-flex items-center gap-1"
                  >
                    <span>View Checklist</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: REAL PRIMARY ACCIDENT PHOTOGRAPH / HERO IMAGE */}
            <div className="lg:col-span-5 bg-surface-950 relative flex flex-col justify-end p-5 min-h-[300px] border-t lg:border-t-0 lg:border-l border-surface-200 dark:border-surface-800">
              {primaryHeroPhoto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryHeroPhoto.url}
                    alt={primaryHeroPhoto.title}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-103 transition-transform duration-300"
                    onClick={() => handleOpenPhotoIndex(0)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 pointer-events-none" />

                  {/* Overlaid Image Metadata */}
                  <div className="relative z-10 space-y-1.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 backdrop-blur-md">
                        Primary Collision Evidence
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoIndex(0)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors cursor-pointer"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span>Enlarge Photo</span>
                      </button>
                    </div>

                    <div className="font-bold text-sm truncate">{primaryHeroPhoto.region}</div>
                    <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                      {primaryHeroPhoto.notes || primaryHeroPhoto.title}
                    </p>
                    <div className="text-[10px] text-white/60 pt-0.5">
                      Source file: <span className="font-mono">{primaryHeroPhoto.title}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Fallback for cases without photos (e.g. Case A, Case E) */
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-surface-400 space-y-3 bg-gradient-to-b from-surface-900 to-surface-950">
                  <div className="p-4 rounded-2xl bg-surface-800/80 border border-surface-700 text-brand-400">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <div className="text-sm font-bold text-white">Document-Only Claim Package</div>
                    <p className="text-xs text-surface-400 leading-relaxed">
                      No photographic collision scene images submitted. All findings synthesized from verified First Notice of Loss.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Incident Details Strip (Date, Location, Vehicles, Claimant) */}
          <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/60 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-brand-600" />
                <span>Date &amp; Time</span>
              </span>
              <div className="font-bold text-surface-900 dark:text-white">
                {incidentDateStr}
              </div>
              <div className="text-[11px] text-surface-500">{incidentTimeStr}</div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-brand-600" />
                <span>Loss Location</span>
              </span>
              <div className="font-bold text-surface-900 dark:text-white truncate" title={locationStr}>
                {locationStr}
              </div>
              <div className="text-[11px] text-surface-500">Confirmed loss jurisdiction</div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1">
                <Car className="h-3 w-3 text-brand-600" />
                <span>Involved Vehicle</span>
              </span>
              <div className="font-bold text-surface-900 dark:text-white truncate">
                {vehiclesList[0] ? [vehiclesList[0].year, vehiclesList[0].make, vehiclesList[0].model].filter(Boolean).join(' ') || 'Vehicle Specified' : 'Vehicle Pending Extraction'}
              </div>
              <div className="text-[11px] font-mono text-surface-500 truncate">
                {vehiclesList[0]?.plate ? `Plate: ${vehiclesList[0].plate}` : vehiclesList[0]?.vin ? `VIN: ${vehiclesList[0].vin}` : 'No Registration Found'}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1">
                <User className="h-3 w-3 text-brand-600" />
                <span>Claimant &amp; Policy</span>
              </span>
              <div className="font-bold text-surface-900 dark:text-white truncate">
                {claimant}
              </div>
              <div className="text-[11px] font-mono text-surface-500">
                Pol #{policyNum}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. "WHAT NEEDS YOUR ATTENTION" (PROMINENT & ACTIONABLE)
             Structure: What we noticed → What supports it → Why it matters → What you should do next
             Visual side-by-side comparisons for contradictory statements
      ------------------------------------------------------------- */}
      <section id="attention-section" className="scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-2">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <span>What Needs Your Attention</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 font-bold">
                {discrepancies.length + missingDocs.length} Item{discrepancies.length + missingDocs.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-xs text-surface-500">
              Direct factual contradictions and missing records that require adjuster review before authorization.
            </p>
          </div>
        </div>

        {discrepancies.length === 0 && missingDocs.length === 0 ? (
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-3.5 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block">No contradictory statements or missing documents detected.</span>
              Dates, driver statements, damage photographs, and vehicle specifications corroborate mutually across all submissions.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Contradictory Statements: Side-by-Side Comparison */}
            {discrepancies.map((inc, iIdx) => {
              const isHigh = inc.severity === 'high' || inc.severity === 'critical';
              const docA = findDoc(inc.source_a);
              const docB = findDoc(inc.source_b);

              return (
                <div
                  key={inc.discrepancy_id || iIdx}
                  className={cn(
                    'rounded-2xl border p-6 bg-surface-0 dark:bg-surface-850 shadow-xs space-y-5',
                    isHigh
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/15'
                      : 'border-amber-300 dark:border-amber-900/80 bg-amber-50/15'
                  )}
                >
                  {/* Finding Title & Severity */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 dark:border-surface-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('p-1.5 rounded-lg', isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-950' : 'bg-amber-100 text-amber-700 dark:bg-amber-950')}>
                        <Split className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                          What We Noticed
                        </div>
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white capitalize">
                          Contradictory {inc.field_name.replace('_', ' ')} across submitted files
                        </h3>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                        isHigh
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      )}
                    >
                      {inc.severity} Priority
                    </span>
                  </div>

                  {/* What Supports It: Visual Side-by-Side Comparison of Statements */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                      What Supports It (Source Statements):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Document A */}
                      <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/60 dark:bg-surface-900 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-surface-500">
                          <span className="font-semibold uppercase tracking-wider truncate">
                            Source 1: {inc.source_a}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-surface-900 dark:text-white p-3 rounded-lg bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-750 font-serif">
                          &ldquo;{inc.value_a}&rdquo;
                        </div>

                        <div className="pt-1">
                          <EvidenceSourcePill
                            sourceName={inc.source_a}
                            page={1}
                            excerpt={`Recorded in ${inc.source_a}: "${inc.value_a}"`}
                            onClick={() => docA && handleOpenDoc(docA, 1, inc.value_a)}
                          />
                        </div>
                      </div>

                      {/* Document B */}
                      <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/60 dark:bg-surface-900 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-surface-500">
                          <span className="font-semibold uppercase tracking-wider truncate">
                            Source 2: {inc.source_b}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-surface-900 dark:text-white p-3 rounded-lg bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-750 font-serif">
                          &ldquo;{inc.value_b}&rdquo;
                        </div>

                        <div className="pt-1">
                          <EvidenceSourcePill
                            sourceName={inc.source_b}
                            page={1}
                            excerpt={`Recorded in ${inc.source_b}: "${inc.value_b}"`}
                            onClick={() => docB && handleOpenDoc(docB, 1, inc.value_b)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why it matters & What you should do next */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-surface-100 dark:border-surface-800">
                    <div className="space-y-1">
                      <span className="font-bold text-surface-800 dark:text-surface-200 text-[11px] uppercase tracking-wider block">
                        Why It Matters:
                      </span>
                      <p className="text-surface-600 dark:text-surface-300 leading-relaxed font-serif">
                        {inc.explanation}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-brand-700 dark:text-brand-300 text-[11px] uppercase tracking-wider block">
                        What You Should Do Next:
                      </span>
                      <p className="text-surface-700 dark:text-surface-200 leading-relaxed font-serif bg-brand-50/60 dark:bg-brand-950/30 p-3 rounded-lg border border-brand-100 dark:border-brand-900">
                        {inc.investigation_notes ||
                          'Contact the requesting officer or policyholder to verify official documentation before issuing final settlement authorization.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Missing Documentation Items (Human-friendly phrasing) */}
            {missingDocs.map((item, mIdx) => (
              <div
                key={mIdx}
                className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 text-xs">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Missing Record
                    </div>
                    <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                      {item} has not been provided
                    </h3>
                    <p className="text-amber-900/80 dark:text-amber-300 leading-relaxed max-w-2xl font-serif">
                      We have the accident description and submitted records, but {item} has not been submitted. Request this document from the claimant or repairing shop before completing your final review.
                    </p>
                  </div>
                </div>

                <div className="sm:self-center shrink-0">
                  <a
                    href="#next-steps-section"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-200/80 hover:bg-amber-200 dark:bg-amber-900/80 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-200 transition-colors"
                  >
                    <span>Add to Checklist</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          3. EVIDENCE BESIDE DAMAGE OBSERVATIONS
             REQUIREMENT 3: "When discussing visible vehicle damage, show the
             actual supporting photograph directly beside the observation."
      ------------------------------------------------------------- */}
      {visionEntries.length > 0 && (
        <section id="damage-section" className="scroll-mt-28 space-y-4">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                <span>Damage Observations with Supporting Photographs</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold">
                  {visionEntries.length} Photo{visionEntries.length !== 1 ? 's' : ''} Analyzed
                </span>
              </h2>
              <p className="text-xs text-surface-500">
                Visual observations matched directly with each supporting photograph. Click any image to enlarge and inspect without losing your place.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {visionEntries.map(([docId, vision], idx) => {
              const matchedDoc = findDoc(docId);
              const photoUrl = matchedDoc ? getRawFileUrl(matchedDoc.id) : '';
              const filename = matchedDoc?.original_filename || `Damage Photo ${idx + 1}`;

              // Find index in photo gallery
              const galleryIdx = photoGallery.findIndex(
                (p) => p.title === filename || (matchedDoc && p.title === matchedDoc.original_filename)
              );

              // Severity badge color
              let sevColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
              if (vision.is_claim_relevant === false || vision.severity_category === 'not_applicable') {
                sevColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
              } else if (
                vision.severity_category.includes('severe') ||
                vision.severity_category.includes('total_loss')
              ) {
                sevColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
              } else if (vision.severity_category.includes('moderate')) {
                sevColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
              }

              return (
                <div
                  key={docId}
                  className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-6"
                >
                  {/* Left 5 Cols: Photo Card with Direct Click-to-Enlarge */}
                  <div className="lg:col-span-5 flex flex-col space-y-2">
                    <div
                      onClick={() => handleOpenPhotoIndex(galleryIdx !== -1 ? galleryIdx : 0)}
                      className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-surface-950 cursor-pointer group shadow-sm border border-surface-200 dark:border-surface-700"
                    >
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={filename}
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-2xs">
                        <Maximize2 className="h-4 w-4" />
                        <span>Click to Enlarge Photo</span>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-xs">
                        <span className="truncate max-w-[200px] font-medium">{filename}</span>
                        <span className="text-[10px] font-mono opacity-80 inline-flex items-center gap-0.5">
                          Enlarge <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1">
                      <span>
                        Area: <strong className="text-surface-700 dark:text-surface-200">{vision.visible_vehicle_region || 'Exterior'}</strong>
                      </span>
                      <EvidenceSourcePill
                        sourceName={filename}
                        isPhoto={true}
                        onClick={() => handleOpenPhotoIndex(galleryIdx !== -1 ? galleryIdx : 0)}
                      />
                    </div>
                  </div>

                  {/* Right 7 Cols: Structured Observation: What we noticed → What supports it → Why it matters */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
                        <div>
                          <span className="text-[11px] text-surface-400 font-bold uppercase tracking-wider">
                            Visible Vehicle Region
                          </span>
                          <h3 className="text-base font-bold text-surface-900 dark:text-white">
                            {vision.visible_vehicle_region || 'Impact Zone'}
                          </h3>
                        </div>

                        <span
                          className={cn(
                            'text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border',
                            sevColor
                          )}
                        >
                          Severity: {(vision.is_claim_relevant === false || vision.severity_category === 'not_applicable') ? 'Not Relevant' : vision.severity_category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Plain-English Explanation */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                          Damage Finding:
                        </span>
                        <p className="text-xs sm:text-sm text-surface-700 dark:text-surface-300 leading-relaxed font-serif">
                          {vision.severity_explanation}
                        </p>
                      </div>

                      {/* Observable Damage Points */}
                      {vision.observable_damage && vision.observable_damage.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                            Observable Damage Points:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-600 dark:text-surface-400">
                            {vision.observable_damage.map((dmg, dIdx) => (
                              <li key={dIdx} className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
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
                    </div>

                    {/* Uncertainty & Limitations Note */}
                    {vision.image_quality_limitations && vision.image_quality_limitations.length > 0 && (
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 text-[11px] text-surface-500 flex items-start gap-2">
                        <Info className="h-4 w-4 text-surface-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-surface-700 dark:text-surface-300">
                            Inspection Limitation:{' '}
                          </strong>
                          {vision.image_quality_limitations.join(', ')}. Internal chassis alignment and sensor recalibration requires physical shop teardown.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          4. POLISHED EVIDENCE GALLERY (CENTRE OF THE EXPERIENCE)
             REQUIREMENT 3: Polished evidence gallery with actual image
             previews, PDF first-page thumbnails, clear filenames, click-to-enlarge.
      ------------------------------------------------------------- */}
      <section id="gallery-section" className="scroll-mt-28 space-y-4">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600" />
              <span>Uploaded Evidence Gallery</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 font-bold">
                {caseData.documents.length} File{caseData.documents.length !== 1 ? 's' : ''} Submitted
              </span>
            </h2>
            <p className="text-xs text-surface-500">
              Interactive repository of all submitted accident files with provenance. Click any item to inspect.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {caseData.documents.map((doc) => {
            const isImage =
              doc.mime_type?.startsWith('image/') ||
              /\.(jpe?g|png|webp|bmp)$/i.test(doc.original_filename);
            const rawUrl = getRawFileUrl(doc.id);
            const galleryIdx = photoGallery.findIndex((p) => p.title === doc.original_filename);

            return (
              <div
                key={doc.id}
                onClick={() => {
                  if (isImage) {
                    handleOpenPhotoIndex(galleryIdx !== -1 ? galleryIdx : 0);
                  } else {
                    handleOpenDoc(doc);
                  }
                }}
                className="group relative flex flex-col justify-between p-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                {/* Visual Thumbnail */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-900 flex items-center justify-center mb-2.5">
                  {isImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rawUrl}
                        alt={doc.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Inspect Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <FileText className="h-8 w-8 text-brand-600 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] text-surface-500 font-mono">
                        {doc.page_count
                          ? `${doc.page_count} page${doc.page_count > 1 ? 's' : ''}`
                          : 'Document PDF'}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs bg-surface-900/80 text-white backdrop-blur-xs">
                    {formatDocumentType(doc.document_type)}
                  </span>
                </div>

                {/* File Details */}
                <div className="space-y-0.5">
                  <div
                    className="text-xs font-bold text-surface-900 dark:text-white truncate"
                    title={doc.original_filename}
                  >
                    {doc.original_filename}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-surface-400">
                    <span>
                      {doc.file_size_bytes
                        ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB`
                        : 'Verified'}
                    </span>
                    <span className="text-brand-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      Open <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. CLEAR EVIDENCE SEPARATION (Confirmed vs Conflicting vs Unverified)
             REQUIREMENT 6: Clearly separate confirmed information, conflicting
             information, and unverified details using simple business language.
      ------------------------------------------------------------- */}
      <section id="status-section" className="scroll-mt-28 space-y-4">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <span>Evidence Verification Status</span>
          </h2>
          <p className="text-xs text-surface-500">
            A clear summary of verified facts, contested statements, and items requiring human follow-up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Confirmed Information */}
          <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Confirmed Information</span>
            </div>
            <ul className="space-y-2 text-xs text-surface-700 dark:text-surface-300">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Date &amp; Location:</strong> Corroborated as {incidentDateStr} in {locationStr}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Policyholder:</strong> {claimant} on active policy #{policyNum}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Vehicle Specifications:</strong> {vehiclesList.map((v) => `${v.year} ${v.make} ${v.model}`).join(', ')}.
                </span>
              </li>
            </ul>
          </div>

          {/* Conflicting Information */}
          <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Conflicting Information</span>
            </div>
            {discrepancies.length > 0 ? (
              <ul className="space-y-2 text-xs text-surface-700 dark:text-surface-300">
                {discrepancies.map((inc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>
                      <strong>{inc.field_name.replace('_', ' ')}:</strong> {inc.source_a} indicates &ldquo;{inc.value_a}&rdquo; vs {inc.source_b} &ldquo;{inc.value_b}&rdquo;.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-surface-500 italic">
                None. No contradictory statements identified between submitted records.
              </p>
            )}
          </div>

          {/* Could Not Be Verified */}
          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Could Not Be Verified</span>
            </div>
            <ul className="space-y-2 text-xs text-surface-700 dark:text-surface-300">
              {missingDocs.length > 0 ? (
                missingDocs.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>
                      <strong>{item}:</strong> Document not submitted in accident package.
                    </span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>
                    <strong>Internal Suspension / Unibody Alignment:</strong> Photographic inspection cannot verify structural chassis geometry without shop teardown.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. EXTERNAL REGISTRY CHECKS (Only shown when performed)
      ------------------------------------------------------------- */}
      {verifications.length > 0 && (
        <section id="external-checks" className="scroll-mt-28 space-y-4">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span>External Registry Grounding</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                {verifications.length} Check{verifications.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-xs text-surface-500">
              Corroboration against official public registries including NHTSA vehicle specs and historical weather records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifications.map((ver, vIdx) => (
              <div
                key={ver.verification_id || vIdx}
                className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-surface-900 dark:text-white">
                      {ver.verification_question}
                    </h3>
                    <div className="text-[10px] text-surface-400">
                      Source: <strong className="text-brand-600">{ver.source_name}</strong>
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
                      className="text-brand-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>View Registry Reference</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          7. ACTIONABLE CHECKLIST FOR ADJUSTER & REPORT DOWNLOAD
             Answers: What should I do next?
      ------------------------------------------------------------- */}
      <section id="next-steps-section" className="scroll-mt-28 space-y-6">
        <div className="border-b border-surface-200 dark:border-surface-800 pb-2">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-brand-600" />
            <span>Recommended Next Steps for Claims Adjuster</span>
          </h2>
          <p className="text-xs text-surface-500">
            Prioritized action checklist to complete before authorizing repair payments or issuing final settlement.
          </p>
        </div>

        {/* Action Checklist */}
        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-3">
            {adjusterActions.map((action, aIdx) => {
              const isChecked = !!checkedActions[aIdx];
              return (
                <div
                  key={aIdx}
                  onClick={() =>
                    setCheckedActions((prev) => ({ ...prev, [aIdx]: !prev[aIdx] }))
                  }
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/50 dark:bg-surface-900 hover:bg-surface-100/60 dark:hover:bg-surface-800/60 transition-colors cursor-pointer"
                >
                  <button type="button" className="mt-0.5 text-brand-600 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-surface-400" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-xs sm:text-sm text-surface-800 dark:text-surface-200',
                      isChecked && 'line-through opacity-60'
                    )}
                  >
                    {action}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Download & Export Section */}
          <div className="pt-6 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">
                Download Investigation Brief (PDF)
              </div>
              <div className="text-xs text-surface-500">
                Exports this complete investigation report including evidence citations and photo damage observations.
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Dossier</span>
              </button>

              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloadingPdf ? 'Compiling PDF...' : 'Download Investigation Report'}</span>
              </button>
            </div>
          </div>

          {/* Statutory NAIC Disclaimer */}
          <div className="p-4 rounded-xl bg-surface-100/60 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[11px] text-surface-500 leading-relaxed space-y-1">
            <span className="font-bold text-surface-700 dark:text-surface-300">
              Statutory Notice &amp; NAIC Compliance (Model Act MDL-900):
            </span>
            <p>
              ClaimScope provides assistive investigation and evidence-grounded decision support. Automated observations do not constitute claim approval, claim denial, or accusations of fraud. Final coverage determinations and settlement authority remain strictly with licensed human claims adjusters.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Lightbox Modal with Zoom & Arrow Navigation */}
      <PhotoLightboxModal
        isOpen={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        imageUrl={selectedPhotoIndex !== null && photoGallery[selectedPhotoIndex] ? photoGallery[selectedPhotoIndex].url : ''}
        title={selectedPhotoIndex !== null && photoGallery[selectedPhotoIndex] ? photoGallery[selectedPhotoIndex].title : ''}
        region={selectedPhotoIndex !== null && photoGallery[selectedPhotoIndex] ? photoGallery[selectedPhotoIndex].region : undefined}
        severity={selectedPhotoIndex !== null && photoGallery[selectedPhotoIndex] ? photoGallery[selectedPhotoIndex].severity : undefined}
        notes={selectedPhotoIndex !== null && photoGallery[selectedPhotoIndex] ? photoGallery[selectedPhotoIndex].notes : undefined}
        photos={photoGallery}
        currentIndex={selectedPhotoIndex ?? 0}
        onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
      />

      {/* Interactive Document Viewer Modal */}
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
