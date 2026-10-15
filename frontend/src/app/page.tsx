'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  ArrowRight,
  FileText,
  Camera,
  GitCompare,
  Globe,
  Cpu,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Lock,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* 1. Public Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-900 text-white shadow-xs group-hover:bg-brand-600 transition-colors p-1">
              <Image
                src="/brand/claimscope-logo.png"
                alt="ClaimScope Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-surface-900 leading-tight">
                ClaimScope
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-surface-400 uppercase">
                Investigation AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-surface-600">
            <a href="#capabilities" className="hover:text-surface-900 transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-surface-900 transition-colors">
              Workflow Architecture
            </a>
            <a href="#preview" className="hover:text-surface-900 transition-colors">
              Workbench
            </a>
            <a href="#responsible-ai" className="hover:text-surface-900 transition-colors">
              Governance &amp; Safety
            </a>
            <Link href="/demo" className="hover:text-surface-900 transition-colors flex items-center gap-1">
              <span>Demo Lab</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                5 Scenarios
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Launch Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Atmospheric Brand Background */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-surface-200/80 overflow-hidden bg-surface-0">
        {/* Subtle Atmospheric Background Image */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          aria-hidden="true"
        >
          <Image
            src="/brand/hero-background.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-[0.5]"
            priority
          />
          {/* Subtle multi-layer white/neutral vignette gradient for perfect contrast and editorial elegance */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-0/60 via-transparent to-surface-0" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-surface-0/40 to-surface-0/90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="max-w-4xl space-y-6 text-left sm:text-center sm:mx-auto">
            {/* Category / Context Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-50 border border-surface-200/80 text-surface-700 text-xs font-semibold shadow-2xs backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-brand-600" />
              <span className="font-medium text-surface-900">ClaimScope</span>
              <span className="text-surface-300">•</span>
              <span className="text-surface-500 font-normal">Autonomous P&amp;C Auto Investigation Intelligence</span>
            </div>

            {/* Core Value Statement */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-surface-900 leading-[1.08] sm:max-w-3xl sm:mx-auto">
              Every claim tells a story.{' '}
              <span className="text-brand-600 block sm:inline">ClaimScope connects the evidence.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-surface-600 max-w-2xl sm:mx-auto leading-relaxed">
              An adaptive agentic investigation platform for auto insurance adjusters.
              Ingest incident packages, analyze damage photographs, cross-examine physical facts against police records,
              and generate audit-ready, evidence-backed reports.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Launch Adjuster Workspace
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explore Demo Lab (Cases A – E)
                </Button>
              </Link>
            </div>

            {/* Editorial Technical Badges */}
            <div className="pt-8 border-t border-surface-200/60 flex flex-wrap items-center justify-start sm:justify-center gap-x-6 gap-y-2.5 text-xs text-surface-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-surface-700">Source Provenance</span>
                <span className="text-surface-400">— Every fact cited to page &amp; line</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-surface-700">Adaptive LangGraph</span>
                <span className="text-surface-400">— Conditional node skipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-surface-700">Assistive AI</span>
                <span className="text-surface-400">— NAIC MDL-900 compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Preview Showcase (Accurate representation of real workbench) */}
      <section id="preview" className="py-16 md:py-20 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center space-y-2 mb-10">
          <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            Operational Workbench
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Precision Evidence Inspection for Adjusters
          </h2>
          <p className="text-sm text-surface-500 max-w-xl mx-auto">
            Interactive side-by-side reconciliation of FNOL forms, official police reports, itemized estimates, and vehicle damage photography.
          </p>
        </div>

        {/* Workbench Mock Frame */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-elevated overflow-hidden">
          {/* Frame Bar */}
          <div className="h-10 border-b border-surface-200 bg-surface-100/70 px-4 flex items-center justify-between text-xs text-surface-500">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-surface-300" />
                <span className="h-3 w-3 rounded-full bg-surface-300" />
                <span className="h-3 w-3 rounded-full bg-surface-300" />
              </div>
              <span className="ml-3 font-mono text-[11px] text-surface-600 font-medium">
                claimscope.internal/cases/CS-2026-000004
              </span>
            </div>
            <Badge variant="brand" size="xs">
              Live Investigation Session
            </Badge>
          </div>

          {/* Workbench Interior */}
          <div className="p-6 space-y-6">
            {/* Case Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-100 border border-surface-200 text-surface-800">
                    CS-2026-000004
                  </span>
                  <Badge variant="error" size="xs" dot>
                    ESCALATE FOR HUMAN REVIEW
                  </Badge>
                  <Badge variant="warning" size="xs">
                    HIGH PRIORITY
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-surface-900">
                  Intersection T-Bone Collision with Disputed Impact Timing
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 font-mono">
                  VIN: 1HGCR2F83HA029184
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  NHTSA Grounded
                </span>
              </div>
            </div>

            {/* Stepper Preview */}
            <div className="rounded-lg border border-surface-200 bg-surface-50/60 p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-surface-500">
                LangGraph 7-Stage Conditional Execution
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {[
                  { name: 'Intake Classifier', status: 'Completed', color: 'emerald' },
                  { name: 'FNOL Extraction', status: 'Completed', color: 'emerald' },
                  { name: 'Police Extractor', status: 'Completed', color: 'emerald' },
                  { name: 'Vision Agent', status: 'Completed', color: 'emerald' },
                  { name: 'Consistency Agent', status: 'Conflict Flag', color: 'rose' },
                  { name: 'External Verifier', status: 'Grounded', color: 'emerald' },
                  { name: 'Report Synthesizer', status: 'Complete', color: 'emerald' },
                ].map((s) => (
                  <div key={s.name} className="p-2 rounded bg-surface-0 border border-surface-200">
                    <span className="text-[10px] text-surface-400 block font-medium truncate">{s.name}</span>
                    <span className={`text-[11px] font-bold block text-${s.color}-700`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-side contradiction diff preview */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-status-error" />
                  <span>Cross-Document Evidentiary Contradiction (TRG-MAT-01)</span>
                </div>
                <span className="text-[10px] font-mono text-rose-700 uppercase font-semibold">
                  Rule Triggered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-0 rounded-md p-3 border border-surface-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-surface-400 tracking-wider block">
                    Source A: Insured FNOL Statement (p.1)
                  </span>
                  <p className="font-mono text-surface-800 text-[11px]">
                    &quot;Collision occurred at approximately 14:30 in broad daylight. Road surface was dry and clear.&quot;
                  </p>
                </div>
                <div className="bg-surface-0 rounded-md p-3 border border-surface-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-surface-400 tracking-wider block">
                    Source B: Official Police Accident Report (p.2)
                  </span>
                  <p className="font-mono text-surface-800 text-[11px]">
                    &quot;Dispatched to crash site at 02:45 AM during active thunderstorm. Wet asphalt with standing water.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Workflow Architecture Visualization */}
      <section id="workflow" className="py-16 md:py-20 border-t border-b border-surface-200/80 bg-surface-0">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              Investigation Pipeline
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
              Deterministic Orchestration with LangGraph
            </h2>
            <p className="text-sm text-surface-500">
              ClaimScope doesn&apos;t run a monolithic prompt. It executes an adaptive StateGraph that conditionally routes each file type to specialized agents.
            </p>
          </div>

          {/* Workflow Sequence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Incident Ingestion',
                desc: 'Upload multi-format package: digital PDFs, scanned forms, and scene photos.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'Classification & OCR',
                desc: 'PyMuPDF native extraction + Gemini Vision OCR for handwritten or degraded scans.',
                icon: Search,
              },
              {
                step: '03',
                title: 'Adaptive Routing',
                desc: 'Supervisor dynamically executes or skips agents based strictly on available evidence.',
                icon: Cpu,
              },
              {
                step: '04',
                title: 'Cross-Verification',
                desc: 'Reconciles narratives and verifies facts against public VIN registries and weather data.',
                icon: GitCompare,
              },
              {
                step: '05',
                title: 'Audit Report',
                desc: 'Compiles explainable findings, confidence scores, and adjuster follow-up items.',
                icon: FileCheck2,
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="rounded-lg border border-surface-200 bg-surface-50 p-4 space-y-3 flex flex-col justify-between hover:border-brand-300 transition-all shadow-subtle"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {st.step}
                      </span>
                      <div className="p-1.5 rounded bg-surface-100 text-surface-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-surface-900">{st.title}</h4>
                    <p className="text-xs text-surface-600 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Core Implemented Capabilities */}
      <section id="capabilities" className="py-16 md:py-24 max-w-7xl mx-auto px-6 w-full space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            Production Engineering
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Engineered for Insurance Evidence Rigor
          </h2>
          <p className="text-sm text-surface-500">
            Built without mock data. Every feature directly executes real Python services and Google Gemini SDK calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Capability 1 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-blue-50 text-brand-600">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Multimodal Document Intelligence
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Handles digital PDFs via PyMuPDF native extraction and gracefully falls back to Gemini Vision OCR for handwritten police statements or degraded faxes.
            </p>
          </div>

          {/* Capability 2 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-purple-50 text-purple-600">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Vehicle Damage Vision Analysis
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Standardized physical severity rubric (Minor, Moderate, Severe) classifies point of impact, structural intrusions, and matches photographic findings against damage estimates.
            </p>
          </div>

          {/* Capability 3 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-rose-50 text-rose-600">
              <GitCompare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Cross-Document Conflict Detection
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Compares timestamps, driver identities, vehicle VINs, and impact narratives across documents, producing granular side-by-side discrepancy diffs.
            </p>
          </div>

          {/* Capability 4 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-600">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Source-Grounded Verification
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Grounds vehicle data against the US Government NHTSA vPIC VIN database and cross-checks reported incident conditions with historical weather archives.
            </p>
          </div>

          {/* Capability 5 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Explainable Rule-Driven Outcomes
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Deterministic assessment recommendations cite explicit rule IDs (e.g. TRG-MAT-01 for narrative conflicts, TRG-SEV-03 for estimate mismatch) rather than black-box AI scores.
            </p>
          </div>

          {/* Capability 6 */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-6 space-y-3 shadow-card hover:border-surface-300 transition-all">
            <div className="p-2 w-fit rounded-lg bg-surface-100 text-surface-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900">
              Complete Provenance &amp; PDF Export
            </h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Every extracted field records confidence scores, document name, page number, and original quote. Generates institutional printable investigation reports.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Responsible AI & Governance Statement */}
      <section id="responsible-ai" className="py-16 bg-surface-100/60 border-t border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-200/80 text-surface-700 text-xs font-bold uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            <span>Ethical AI &amp; Regulatory Standard</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">
            Assistive Intelligence. Human Authority.
          </h2>
          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
            ClaimScope operates strictly under human oversight. The system assists licensed claims adjusters and SIU investigators by surfacing verifiable facts and cross-document inconsistencies.
            <strong> ClaimScope never independently denies coverage, approves payouts, or labels any claimant or party as fraudulent.</strong>
            Every finding includes direct provenance back to the source submission.
          </p>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="py-16 md:py-20 bg-surface-0 border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Experience the Investigation Workbench
          </h2>
          <p className="text-sm text-surface-500 max-w-lg mx-auto">
            Test the adaptive engine on synthetic incident packages or ingest new claim files.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open Operational Dashboard
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="md">
                Load Test Scenario (Demo Lab)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Tasteful Minimal Footer */}
      <footer className="py-8 bg-surface-0 text-surface-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-900 text-white p-0.5">
              <Image
                src="/brand/claimscope-logo.png"
                alt="ClaimScope"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-surface-800">ClaimScope</span>
            <span>• Auto Accident Claim Investigation Assistant</span>
          </div>

          <div className="text-[11px] text-surface-400">
            Built by <strong className="text-surface-700 font-medium">Vishnu Pandrangi</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
