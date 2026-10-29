'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  Camera,
  Layers,
  ShieldAlert,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Edit3,
  Undo2,
  Loader2,
  FileCheck2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { IntakeFieldItem, IntakeExtractionResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DetailedInvestigationLoader } from '@/components/cases/DetailedInvestigationLoader';

interface UploadedFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  docType: string;
  sizeStr: string;
}

interface DemoScenario {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  filesSummary: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'case_a',
    title: 'Clean Minor Parking Lot Incident',
    badge: 'Standard Single Document',
    badgeColor: 'bg-surface-200 text-surface-800 dark:bg-surface-700 dark:text-surface-200',
    desc: 'Minor rear bumper contact while parked. Tests routine intake with single FNOL document.',
    filesSummary: '1 Document (FNOL Statement)',
    icon: FileText,
  },
  {
    id: 'case_b',
    title: 'Front Guardrail Impact with Photos',
    badge: 'Photographic Evidence',
    badgeColor: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
    desc: 'Front-end collision with 2 damage photographs for component damage analysis.',
    filesSummary: '3 Files (1 FNOL + 2 Photos)',
    icon: Camera,
  },
  {
    id: 'case_c',
    title: 'Comprehensive Rear-End Collision',
    badge: 'Full Claims Package',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    desc: 'Complete package: FNOL, official Police report, certified repair estimate, and scene photos.',
    filesSummary: '4 Files (3 PDFs + Photos)',
    icon: Layers,
  },
  {
    id: 'case_d',
    title: 'Contradictory Narrative & VIN Mismatch',
    badge: 'Inconsistencies Flagged',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    desc: 'Conflicting dates, mismatched collision accounts between FNOL and police report, VIN suffix mismatch.',
    filesSummary: '3 Files (FNOL, Police, Photos)',
    icon: ShieldAlert,
  },
  {
    id: 'case_e',
    title: 'Incomplete Scanned Claim Statement',
    badge: 'Missing Information / Scanned',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    desc: 'Handwritten/scanned statement with omissions. Tests uncertainty handling and missing fields.',
    filesSummary: '1 Degraded Scanned PDF',
    icon: ScanLine,
  },
];

export const ClaimIntakeFlow: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 'upload' -> 'confirm' -> 'investigating'
  const [step, setStep] = useState<'upload' | 'confirm' | 'investigating'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  // Loading & error states
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Extracted fields state
  const [fields, setFields] = useState<Record<string, IntakeFieldItem>>({});
  const [userEdits, setUserEdits] = useState<Record<string, string>>({});
  const [missingFieldKeys, setMissingFieldKeys] = useState<string[]>([]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Guess document classification from filename
  const detectDocType = (name: string): string => {
    const l = name.toLowerCase();
    if (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') || l.endsWith('.webp')) {
      return 'Damage Photograph';
    }
    if (l.includes('police') || l.includes('traffic') || l.includes('officer')) {
      return 'Police Collision Report';
    }
    if (l.includes('estimate') || l.includes('repair') || l.includes('appraisal')) {
      return 'Body Shop Repair Estimate';
    }
    if (l.includes('fnol') || l.includes('incident') || l.includes('claim') || l.includes('intake')) {
      return 'First Notice of Loss (FNOL)';
    }
    return 'Supporting Document';
  };

  // Handle file addition
  const handleAddFiles = useCallback((newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const added: UploadedFileItem[] = [];

    Array.from(newFiles).forEach((f) => {
      const isImg = f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name);
      added.push({
        id: `${f.name}_${f.size}_${Date.now()}_${Math.random()}`,
        file: f,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
        docType: detectDocType(f.name),
        sizeStr: formatSize(f.size),
      });
    });

    setUploadedFiles((prev) => [...prev, ...added]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Trigger Step 2: Upload custom files, classify, and extract intake details
  const handleProceedToConfirm = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage('Please select or drag in at least one document or photograph to begin.');
      return;
    }

    setIsProcessingUpload(true);
    setErrorMessage(null);

    try {
      // 1. Create a draft case docket
      const createdCase = await api.createCase({
        title: `Auto Claim Review (${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''})`,
        description: 'Auto claim file submitted for multi-document intake and investigation.',
        priority: 'medium',
      });

      setCaseId(createdCase.id);
      setCaseNumber(createdCase.case_number);

      // 2. Upload all files
      const rawFiles = uploadedFiles.map((item) => item.file);
      await api.uploadDocuments(createdCase.id, rawFiles);

      // 3. Extract intake details from documents
      const extraction: IntakeExtractionResult = await api.extractIntakeDetails(createdCase.id);

      setFields(extraction.fields || {});
      setMissingFieldKeys(extraction.missing_fields || []);
      setStep('confirm');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process uploaded files. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // 1-Click Load Synthetic Sample Case
  const handleLoadSampleScenario = async (scenarioId: string) => {
    setIsProcessingUpload(true);
    setErrorMessage(null);

    try {
      const created = await api.loadSyntheticCase(scenarioId);
      setCaseId(created.id);
      setCaseNumber(created.case_number);

      // Extract details for confirmation
      const extraction: IntakeExtractionResult = await api.extractIntakeDetails(created.id);

      setFields(extraction.fields || {});
      setMissingFieldKeys(extraction.missing_fields || []);
      setStep('confirm');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sample scenario.';
      setErrorMessage(msg);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Field Edit Handler
  const handleFieldChange = (fieldKey: string, newVal: string) => {
    setUserEdits((prev) => ({
      ...prev,
      [fieldKey]: newVal,
    }));
  };

  // Step 3: Confirm and Run Investigation
  const handleConfirmAndInvestigate = async () => {
    if (!caseId) return;

    setStep('investigating');
    setErrorMessage(null);

    try {
      // 1. Persist user corrections to the case record
      const updates: Record<string, unknown> = {};
      if (userEdits.claimant_name !== undefined) updates.claimant_name = userEdits.claimant_name;
      if (userEdits.policy_number !== undefined) updates.policy_number = userEdits.policy_number;
      if (userEdits.incident_description !== undefined) updates.description = userEdits.incident_description;
      if (userEdits.incident_date !== undefined) {
        // Parse date safely
        const parsed = new Date(userEdits.incident_date);
        if (!isNaN(parsed.getTime())) {
          updates.incident_date = parsed.toISOString();
        }
      }

      if (Object.keys(updates).length > 0) {
        await api.updateCase(caseId, updates);
      }

      // 2. Trigger adaptive investigation
      await api.runInvestigation(caseId);

      // 3. Navigate directly to the ONE scrolling investigation dossier!
      router.push(`/cases/${caseId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Investigation failed to complete. Please try again.';
      setErrorMessage(msg);
      setStep('confirm');
    }
  };

  // -------------------------------------------------------------
  // RENDER STEP 3: INVESTIGATING PROGRESS
  // -------------------------------------------------------------
  if (step === 'investigating') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <DetailedInvestigationLoader
          isDone={false}
          title="Investigating Claim Package"
          subtitle="Cross-referencing submitted documentation, running computer vision on vehicle photographs, and preparing adjuster findings..."
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER STEP 2: CONFIRM DETAILS
  // -------------------------------------------------------------
  if (step === 'confirm') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Banner with required prompt */}
        <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 mb-1">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Step 2 of 2: Confirm Information</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white">
                “We&apos;ve filled in these details from your documents. Please check that everything looks right.”
              </h2>
              <p className="text-xs text-surface-600 dark:text-surface-400">
                You can correct any field below. Your changes will be clearly recorded alongside the original document provenance.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-3 py-2 rounded-lg text-xs font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 transition-colors cursor-pointer"
              >
                Back to Files
              </button>
              <button
                type="button"
                onClick={handleConfirmAndInvestigate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer"
              >
                <span>Confirm &amp; Start Investigation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirmation Form Sections */}
        <div className="bg-surface-0 dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Section 1: Policy & Claimant */}
          <div className="space-y-4">
            <div className="border-b border-surface-200 dark:border-surface-700 pb-2">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                1. Policy &amp; Claimant Identification
              </h3>
              <p className="text-xs text-surface-500">Core policyholder details identified in the incident submission</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Claimant Name */}
              <ConfirmFieldInput
                label="Insured / Claimant Name"
                fieldKey="claimant_name"
                item={fields.claimant_name}
                currentValue={userEdits.claimant_name ?? fields.claimant_name?.value ?? ''}
                isMissing={missingFieldKeys.includes('claimant_name')}
                onChange={(val) => handleFieldChange('claimant_name', val)}
                placeholder="e.g. Sarah Jenkins"
              />

              {/* Policy Number */}
              <ConfirmFieldInput
                label="Insurance Policy Number"
                fieldKey="policy_number"
                item={fields.policy_number}
                currentValue={userEdits.policy_number ?? fields.policy_number?.value ?? ''}
                isMissing={missingFieldKeys.includes('policy_number')}
                onChange={(val) => handleFieldChange('policy_number', val)}
                placeholder="e.g. PA-2026-981245"
              />
            </div>
          </div>

          {/* Section 2: Incident Date, Time & Location */}
          <div className="space-y-4">
            <div className="border-b border-surface-200 dark:border-surface-700 pb-2">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                2. Accident Timeline &amp; Location
              </h3>
              <p className="text-xs text-surface-500">When and where the collision or loss occurred</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Incident Date */}
              <ConfirmFieldInput
                label="Date of Incident"
                fieldKey="incident_date"
                item={fields.incident_date}
                currentValue={userEdits.incident_date ?? fields.incident_date?.value ?? ''}
                isMissing={missingFieldKeys.includes('incident_date')}
                onChange={(val) => handleFieldChange('incident_date', val)}
                placeholder="e.g. August 22, 2026"
              />

              {/* Incident Time */}
              <ConfirmFieldInput
                label="Time of Incident"
                fieldKey="incident_time"
                item={fields.incident_time}
                currentValue={userEdits.incident_time ?? fields.incident_time?.value ?? ''}
                isMissing={missingFieldKeys.includes('incident_time')}
                onChange={(val) => handleFieldChange('incident_time', val)}
                placeholder="e.g. 08:15 AM"
              />

              {/* Location */}
              <ConfirmFieldInput
                label="Incident Location"
                fieldKey="incident_location"
                item={fields.incident_location}
                currentValue={userEdits.incident_location ?? fields.incident_location?.value ?? ''}
                isMissing={missingFieldKeys.includes('incident_location')}
                onChange={(val) => handleFieldChange('incident_location', val)}
                placeholder="e.g. 8th Ave & Pine St, Denver CO"
              />
            </div>
          </div>

          {/* Section 3: Vehicles & Description */}
          <div className="space-y-4">
            <div className="border-b border-surface-200 dark:border-surface-700 pb-2">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                3. Vehicle Details &amp; Accident Summary
              </h3>
              <p className="text-xs text-surface-500">Vehicle identity and what happened according to the submitted records</p>
            </div>

            <div className="space-y-4">
              {/* Vehicle */}
              <ConfirmFieldInput
                label="Vehicle Information (Year, Make, Model, VIN, Plate)"
                fieldKey="vehicle_details"
                item={fields.vehicle_details}
                currentValue={userEdits.vehicle_details ?? fields.vehicle_details?.value ?? ''}
                isMissing={missingFieldKeys.includes('vehicle_details')}
                onChange={(val) => handleFieldChange('vehicle_details', val)}
                placeholder="e.g. 2021 Ford F-150 (VIN: 1FTFW1E84MFA77192)"
              />

              {/* Police Report */}
              <ConfirmFieldInput
                label="Official Police Collision Report Number"
                fieldKey="police_report_number"
                item={fields.police_report_number}
                currentValue={userEdits.police_report_number ?? fields.police_report_number?.value ?? ''}
                isMissing={missingFieldKeys.includes('police_report_number')}
                onChange={(val) => handleFieldChange('police_report_number', val)}
                placeholder="e.g. PR-2026-44019 (or leave blank if no police report filed)"
              />

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                    Accident Narrative / Loss Description
                  </label>
                  {fields.incident_description?.source_document && (
                    <span className="text-[10px] text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                      From: {fields.incident_description.source_document}
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={userEdits.incident_description ?? fields.incident_description?.value ?? ''}
                  onChange={(e) => handleFieldChange('incident_description', e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Describe the sequence of collision events..."
                />
                {userEdits.incident_description !== undefined && fields.incident_description?.value && (
                  <div className="text-[11px] text-brand-600 dark:text-brand-400">
                    ✓ User edited (Original in document: &ldquo;{fields.incident_description.value}&rdquo;)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="pt-6 border-t border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-surface-500">
              {Object.keys(userEdits).length > 0 ? (
                <span className="text-brand-600 dark:text-brand-400 font-semibold">
                  {Object.keys(userEdits).length} field(s) edited by you. Source provenance will be preserved.
                </span>
              ) : (
                <span>All fields match extracted document information.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white bg-surface-100 dark:bg-surface-800 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndInvestigate}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer"
              >
                <span>Confirm &amp; Run Investigation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER STEP 1: UPLOAD & SELECT
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Intro Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a1f44] dark:text-white">
          New Claim Investigation
        </h1>
        <p className="text-xs sm:text-sm text-surface-500">
          Upload accident documents and vehicle photographs. We&apos;ll automatically extract accident details, verify consistency, and prepare an evidence-backed report.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all bg-surface-0 dark:bg-surface-850',
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[1.01]'
            : 'border-surface-300 dark:border-surface-700 hover:border-brand-400'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleAddFiles(e.target.files);
            }
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 bg-brand-50 dark:bg-brand-950/60 rounded-2xl text-brand-600 dark:text-brand-400">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-surface-900 dark:text-white">
              Drag &amp; drop accident documents and photos here
            </p>
            <p className="text-xs text-surface-500">
              Supports First Notice of Loss (FNOL), Police collision reports, repair estimates, and vehicle damage photographs (PDF, JPEG, PNG)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer"
          >
            <span>Browse Files</span>
          </button>
        </div>
      </div>

      {/* Uploaded Files Gallery */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 bg-surface-0 dark:bg-surface-850 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">
              Selected Files ({uploadedFiles.length})
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand-600 hover:underline font-semibold cursor-pointer"
            >
              + Add More Files
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-750 bg-surface-50/50 dark:bg-surface-900 group"
              >
                {/* Visual Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-800 shrink-0 flex items-center justify-center">
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-brand-600" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-surface-900 dark:text-white truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                    {item.docType}
                  </p>
                  <p className="text-[10px] text-surface-400">
                    {item.sizeStr}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(item.id)}
                  className="p-1 rounded-md text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action button to proceed */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToConfirm}
              disabled={isProcessingUpload}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 active:scale-98 shadow-sm transition-all cursor-pointer"
            >
              {isProcessingUpload ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Classifying &amp; Extracting Details...</span>
                </>
              ) : (
                <>
                  <span>Continue to Confirm Details</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 1-Click Sample Claims Evaluation Sandbox */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800 pb-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-surface-900 dark:text-white">
            Or try one of 5 sample accident claim packages (1-Click)
          </h2>
        </div>

        <p className="text-xs text-surface-500">
          Select any pre-configured claim package to instantly load actual documents, damage photos, and see the full investigation journey without having to find files.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => handleLoadSampleScenario(sc.id)}
                className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-brand-600 dark:text-brand-400 group-hover:bg-brand-50 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-brand-600 transition-colors">
                      {sc.title}
                    </h3>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded shrink-0', sc.badgeColor)}>
                    {sc.badge}
                  </span>
                </div>

                <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                  {sc.desc}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 text-surface-500">
                  <span className="font-medium text-surface-700 dark:text-surface-300">
                    {sc.filesSummary}
                  </span>
                  <span className="inline-flex items-center gap-1 text-brand-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Load Claim</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// HELPER: Confirm Field Input with Provenance & User Edit Tracking
// -------------------------------------------------------------
interface ConfirmFieldInputProps {
  label: string;
  fieldKey: string;
  item?: IntakeFieldItem;
  currentValue: string;
  isMissing: boolean;
  onChange: (val: string) => void;
  placeholder?: string;
}

const ConfirmFieldInput: React.FC<ConfirmFieldInputProps> = ({
  label,
  fieldKey,
  item,
  currentValue,
  isMissing,
  onChange,
  placeholder,
}) => {
  const isEdited = item?.value !== undefined && currentValue !== item.value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
          {label}
        </label>

        {/* Provenance Badge */}
        {item?.source_document ? (
          <span className="text-[10px] font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded truncate max-w-[200px]" title={item.source_document}>
            From: {item.source_document}
          </span>
        ) : isMissing ? (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            Missing in documents
          </span>
        ) : null}
      </div>

      <input
        type="text"
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full text-xs p-2.5 rounded-lg border bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
          isEdited
            ? 'border-brand-500 bg-brand-50/20'
            : isMissing && !currentValue
            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20'
            : 'border-surface-200 dark:border-surface-700'
        )}
      />

      {/* User edit footnote preserving original provenance */}
      {isEdited && item?.value && (
        <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
          ✓ User edited (Original in document: &ldquo;{item.value}&rdquo;)
        </div>
      )}
    </div>
  );
};

