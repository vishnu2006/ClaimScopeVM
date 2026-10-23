'use client';

import React, { useState } from 'react';
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
  ArrowUpRight,
  Scale,
  Car,
  FileSpreadsheet,
  Check,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { StarBorder } from '@/components/ui/StarBorder';
import { GooeyNav, GooeyNavItem } from '@/components/ui/GooeyNav';
import { SystemArchitectureSection } from '@/components/home/SystemArchitectureSection';
import { UserProfileMenu } from '@/components/layout/UserProfileMenu';

export default function PublicHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* 1. Refined Corporate Enterprise Header (Standard 64px Height) */}
      <header className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/95 dark:bg-[#0c1322]/95 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-logo-container shadow-2xs group-hover:scale-105 transition-transform p-1">
              <Image
                src="/brand/vmlogo.png"
                alt="ClaimScope"
                width={30}
                height={30}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#0a1f44] dark:text-white">
                  ClaimScope
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-growth-50 dark:bg-growth-900/40 text-growth-700 dark:text-growth-300 border border-growth-200 dark:border-growth-800 uppercase tracking-wider">
                  P&amp;C
                </span>
              </div>
              <span className="text-[9px] font-medium tracking-wider text-surface-400 uppercase mt-0.5">
                Claims Decision Intelligence
              </span>
            </div>
          </Link>

          {/* Interactive Gooey Nav for Public Header */}
          <div className="hidden lg:flex items-center">
            <GooeyNav
              items={[
                { label: 'Capabilities', href: '#capabilities' },
                { label: 'Architecture', href: '#architecture' },
                { label: 'Workbench', href: '#preview' },
                { label: 'Governance', href: '#governance' },
              ]}
              initialActiveIndex={0}
              size="sm"
              frame={false}
              color="#086afc"
              activeTextColor="#ffffff"
              spread={45}
              animationTime={500}
              gooeyness={0.4}
              wobble={0.4}
              hoverEffect={true}
            />
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="h-8 w-8 p-1.5 rounded-lg" />
            <UserProfileMenu />
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <StarBorder
                as="span"
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
                className="!py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 inline-flex items-center"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </StarBorder>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-surface-200 bg-surface-0 dark:bg-[#0c1322] px-4 sm:px-6 py-4 shadow-elevated space-y-3 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-xs font-semibold text-surface-700 dark:text-surface-300">
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-brand-600 py-1.5"
              >
                Capabilities
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-brand-600 py-1.5"
              >
                Architecture
              </a>
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-brand-600 py-1.5"
              >
                Workbench
              </a>
              <a
                href="#governance"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-brand-600 py-1.5"
              >
                Governance
              </a>
            </nav>
            <div className="pt-2 border-t border-surface-100 dark:border-surface-200/50">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button variant="vm-primary" size="sm" className="w-full justify-center">
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section: Editorial Proportions & Balanced Density */}
      <section className="relative pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-14 lg:pb-16 border-b border-surface-200 overflow-hidden bg-gradient-to-b from-surface-0 via-surface-0 to-surface-50">
        {/* Subtle geometric grid */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05] [background-image:linear-gradient(to_right,#0a1f44_1px,transparent_1px),linear-gradient(to_bottom,#0a1f44_1px,transparent_1px)] bg-[size:36px_36px]" />
        
        {/* Soft brand glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-br from-[#086afc]/10 via-[#5eba46]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left 7 Columns: Editorial Headline & Value Narrative */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              {/* Context Pill */}
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-0 dark:bg-surface-100/90 border border-surface-200 text-surface-700 text-[11px] font-semibold shadow-2xs">
                <span className="flex h-1.5 w-1.5 rounded-full bg-growth-500" />
                <span className="font-bold text-[#0a1f44] dark:text-white">P&amp;C Insurance Technology</span>
                <span className="text-surface-300">•</span>
                <span className="text-surface-500 font-medium">Auto Accident Claim Investigation</span>
              </div>

              {/* Authority Heading - Calibrated Scale */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-black tracking-tight text-[#0a1f44] dark:text-white leading-[1.12]">
                Domain expertise meets{' '}
                <span className="text-[#086afc] relative inline-block">
                  agentic execution.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm lg:text-[14px] text-surface-600 dark:text-surface-400 max-w-xl leading-relaxed font-normal">
                An adaptive, multimodal decision-support platform engineered specifically for Property &amp; Casualty claims adjusters and SIU investigators. Transform chaotic FNOL forms, police reports, repair estimates, and scene photos into verified, audit-ready adjudications.
              </p>

              {/* Call-to-actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/dashboard">
                  <StarBorder
                    as="span"
                    color="#086afc"
                    trailColor="#5eba46"
                    duration={3.5}
                    thickness={2}
                    radius={10}
                    glow={0.7}
                    hover="lap"
                    backgroundColor="#086afc"
                    textColor="#ffffff"
                    borderColor="rgba(8, 106, 252, 0.4)"
                    className="!py-2.5 !px-5 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 inline-flex items-center"
                  >
                    <span>Launch Adjuster Cockpit</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </StarBorder>
                </Link>
                <Link href="/demo">
                  <Button variant="secondary" size="sm">
                    Examine 5 Test Scenarios
                  </Button>
                </Link>
              </div>

              {/* 3 Core Trust Signals */}
              <div className="pt-3 grid grid-cols-3 gap-3 border-t border-surface-200/80 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-surface-900 block text-xs">NAIC MDL-900</span>
                  <span className="text-surface-500 text-[10px]">Human-in-the-Loop Standard</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-surface-900 block text-xs">NHTSA + Meteo</span>
                  <span className="text-surface-500 text-[10px]">Authoritative Public Grounding</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-surface-900 block text-xs">100% Provenance</span>
                  <span className="text-surface-500 text-[10px]">Audit-Traceable Citations</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Asymmetric Live Cockpit Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] p-4.5 sm:p-5 shadow-subtle relative overflow-hidden space-y-3.5">
                <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-growth-500 animate-pulse" />
                    <span className="text-xs font-bold text-surface-900 uppercase tracking-wider font-mono">
                      CS-2026-000003
                    </span>
                  </div>
                  <Badge variant="warning" size="xs" dot>
                    Escalate For Review
                  </Badge>
                </div>

                {/* Conflict Showcase */}
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-surface-50 dark:bg-[#17243b] p-3 border border-surface-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-semibold text-surface-500">
                      <span>Statement vs. Physical Evidence</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold uppercase text-[9px]">Critical Mismatch</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1">
                      <div className="bg-surface-0 dark:bg-surface-200/40 p-2 rounded border border-surface-200">
                        <span className="font-bold text-surface-700 block text-[9.5px] uppercase">Driver FNOL</span>
                        <p className="text-surface-600 italic mt-0.5 leading-snug">&quot;Hit deer at 25mph, minor bumper scrape.&quot;</p>
                      </div>
                      <div className="bg-surface-0 dark:bg-surface-200/40 p-2 rounded border border-surface-200">
                        <span className="font-bold text-surface-700 block text-[9.5px] uppercase">Police + Photos</span>
                        <p className="text-surface-600 italic mt-0.5 leading-snug">&quot;Red-light T-bone impact. Airbags deployed.&quot;</p>
                      </div>
                    </div>
                  </div>

                  {/* Grounded External Check */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg border border-growth-200 dark:border-growth-900/60 bg-growth-50/50 dark:bg-growth-900/20">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-growth-600" />
                      <span className="font-medium text-surface-800 text-[11px]">NHTSA VIN vPIC Database</span>
                    </div>
                    <Badge variant="growth" size="xs">
                      Factory Verified
                    </Badge>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-surface-500 text-[10.5px]">LangGraph Multi-Agent Pass: Complete</span>
                  <Link
                    href="/cases"
                    className="text-[#086afc] font-semibold text-[11px] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect Case</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Strategic Value Pillars (Compact 4-Column Strip) */}
      <section className="py-8 sm:py-10 border-b border-surface-200 bg-surface-0 dark:bg-[#0c1322]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="border-l-2 border-[#086afc] pl-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-[#086afc] uppercase tracking-wider block">Domain Precision</span>
              <h3 className="text-xs sm:text-sm font-bold text-surface-900">P&amp;C Automobile Claims</h3>
              <p className="text-[11px] text-surface-500 leading-relaxed">
                Tuned specifically for FNOL forms, police collision reports, body shop estimates, and vehicle photography.
              </p>
            </div>

            <div className="border-l-2 border-[#5eba46] pl-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-[#5eba46] uppercase tracking-wider block">Adaptive Speed</span>
              <h3 className="text-xs sm:text-sm font-bold text-surface-900">Conditional Orchestration</h3>
              <p className="text-[11px] text-surface-500 leading-relaxed">
                Supervisor routes only relevant extractors. Gracefully skips missing paperwork without hallucinating or crashing.
              </p>
            </div>

            <div className="border-l-2 border-[#febc10] pl-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Continuous Grounding</span>
              <h3 className="text-xs sm:text-sm font-bold text-surface-900">Official Government Registries</h3>
              <p className="text-[11px] text-surface-500 leading-relaxed">
                Decodes VINs directly via US DOT NHTSA vPIC and correlates weather with Open-Meteo historical archives.
              </p>
            </div>

            <div className="border-l-2 border-[#0a1f44] dark:border-surface-400 pl-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-surface-700 uppercase tracking-wider block">Regulatory Defense</span>
              <h3 className="text-xs sm:text-sm font-bold text-surface-900">Institutional Audit PDF</h3>
              <p className="text-[11px] text-surface-500 leading-relaxed">
                ReportLab multi-page reports with complete source quotes, field confidence scores, and adjuster checklist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Comprehensive Capabilities Section */}
      <section id="capabilities" className="py-10 sm:py-14 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-[#086afc] text-[10px] font-bold uppercase tracking-wider">
            <span>Specialized Capabilities</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0a1f44] dark:text-white">
            Engineered for the reality of modern claim packages.
          </h2>
          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
            Incident files arrive incomplete, inconsistent, and unstructured. ClaimScope provides licensed adjusters with verifiable decision support.
          </p>
        </div>

        {/* 3 Balanced Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Multimodal Intake */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 space-y-2.5 shadow-subtle hover:border-[#086afc]/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-[#086afc] flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-surface-900">Multimodal Intake &amp; OCR</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Native vector PDF parsing via PyMuPDF with seamless Google Gemini multimodal vision fallback for handwritten police statements and low-contrast faxes.
            </p>
            <ul className="pt-2 space-y-1 text-[11px] text-surface-500 border-t border-surface-100">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Digital PDF vector extraction</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Scanned handwritten note OCR</li>
            </ul>
          </div>

          {/* Card 2: Damage Vision */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 space-y-2.5 shadow-subtle hover:border-[#086afc]/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-surface-900">Photographic Damage Inspection</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Standardized physical damage evaluation categorizing visible impact zones, affected body panels, and severity ratings (Minor, Moderate, Severe, Total Loss).
            </p>
            <ul className="pt-2 space-y-1 text-[11px] text-surface-500 border-t border-surface-100">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Multi-angle vehicle inspection</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Camera limitation notes</li>
            </ul>
          </div>

          {/* Card 3: Discrepancy Engine */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 space-y-2.5 shadow-subtle hover:border-[#086afc]/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <GitCompare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-surface-900">Cross-Document Contradiction Engine</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Deterministic cross-referencing detecting narrative conflicts (driver claims deer strike while police record cites red-light collision), VIN mismatches, and photo discrepancies.
            </p>
            <ul className="pt-2 space-y-1 text-[11px] text-surface-500 border-t border-surface-100">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Side-by-side comparative diffs</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-growth-500" /> Materiality &amp; severity scoring</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. System Architecture Section */}
      <SystemArchitectureSection />

      {/* 6. Product Preview Section */}
      <section id="preview" className="py-10 sm:py-14 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-growth-50 text-growth-700 text-[10px] font-bold uppercase tracking-wider">
              <span>Operational Workbench</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0a1f44] dark:text-white">
              6-Tab Adjuster Investigation Interface
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 max-w-xl leading-relaxed">
              Inspect raw files, evaluate field-level provenance, review comparative discrepancies, check external NHTSA records, and export institutional PDF packets.
            </p>
          </div>
          <Link href="/cases">
            <Button variant="vm-primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open Claims Registry
            </Button>
          </Link>
        </div>

        {/* Workbench Mock Showcase */}
        <div className="rounded-xl border border-surface-200 bg-surface-0 dark:bg-[#121c2e] p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-surface-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-surface-900">Claim CS-2026-000003</span>
              <Badge variant="brand" size="xs">Toyota RAV4 XLE</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-surface-500">Adjudication Outcome:</span>
              <Badge variant="warning" size="xs" dot>ESCALATE FOR HUMAN REVIEW</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-100/50 border border-surface-200 space-y-1">
              <span className="font-bold text-surface-800 uppercase tracking-wider text-[10px] block">Discrepancy Severity</span>
              <div className="text-lg font-black text-rose-600">CRITICAL</div>
              <p className="text-[11px] text-surface-500">Point of impact and narrative direct liability contradiction.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-100/50 border border-surface-200 space-y-1">
              <span className="font-bold text-surface-800 uppercase tracking-wider text-[10px] block">Federal VIN Grounding</span>
              <div className="text-lg font-black text-growth-600">VERIFIED</div>
              <p className="text-[11px] text-surface-500">Matched 17-character VIN factory specifications in NHTSA database.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-100/50 border border-surface-200 space-y-1">
              <span className="font-bold text-surface-800 uppercase tracking-wider text-[10px] block">Audit-Ready Export</span>
              <div className="text-lg font-black text-[#086afc]">READY</div>
              <p className="text-[11px] text-surface-500">11-section institutional PDF package with official letterhead.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Responsible AI & NAIC MDL-900 Governance */}
      <section id="governance" className="py-10 sm:py-12 bg-surface-0 border-t border-b border-surface-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-100 text-[#0a1f44] text-[10px] font-bold uppercase tracking-wider">
            <Lock className="h-3 w-3 text-growth-600" />
            <span>NAIC Model Act MDL-900 Compliance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a1f44] dark:text-white">
            Assistive Intelligence. Licensed Human Authority.
          </h2>
          <p className="text-xs sm:text-[13px] text-surface-600 leading-relaxed max-w-2xl mx-auto">
            In compliance with the <strong>National Association of Insurance Commissioners (NAIC) Model Unfair Claims Settlement Practices Act</strong>, ClaimScope never autonomously denies coverage, cancels policies, or makes unsubstantiated legal fraud accusations. It serves as a rigorous decision-support companion—surfacing verifiable facts, calculating explainable risk scores, and empowering licensed adjusters.
          </p>
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-[#0a1f44] to-[#086afc] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Ready to modernize auto accident claim investigation?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
            Experience our adaptive multi-agent system on real synthetic packages or ingest new claim files.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link href="/dashboard">
              <Button
                variant="growth"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Launch Adjuster Workspace
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="secondary"
                size="sm"
                className="bg-surface-0 hover:bg-surface-100 text-surface-900 border-surface-200 shadow-2xs font-semibold"
              >
                Test 5 Demo Scenarios
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. ValueMomentum-Grade Corporate Footer */}
      <footer className="py-6 sm:py-8 bg-surface-0 border-t border-surface-200 text-surface-500 text-xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg brand-logo-container p-1">
              <Image
                src="/brand/vmlogo.png"
                alt="ValueMomentum ClaimScope"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#0a1f44] dark:text-white text-xs">ClaimScope</span>
              <span className="text-[10px] text-surface-400">P&amp;C Automobile Claims Adjudication Platform</span>
            </div>
          </div>

          <div className="text-[11px] text-surface-400 text-center sm:text-right">
            <span>Enterprise Decision-Support System • Built by </span>
            <strong className="text-surface-700 font-semibold">Vishnu Pandrangi</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
