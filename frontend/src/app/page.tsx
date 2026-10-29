'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileCheck2,
  Search,
  FileText,
  Camera,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Download,
  ScanLine,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserProfileMenu } from '@/components/layout/UserProfileMenu';

export default function PublicHomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0c1322] text-surface-900 dark:text-surface-100 flex flex-col">
      {/* Clean Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-surface-200/80 dark:border-surface-800 bg-surface-0/95 dark:bg-[#0c1322]/95 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-logo-container p-1 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/brand/vmlogo.png"
                alt="ClaimScope"
                width={30}
                height={30}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-[#0a1f44] dark:text-white">
                ClaimScope
              </span>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                Auto Claims
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="hidden sm:inline-block text-xs font-semibold text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white px-3 py-1.5"
            >
              Claims History
            </Link>
            <Link
              href="/demo"
              className="hidden sm:inline-block text-xs font-semibold text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white px-3 py-1.5"
            >
              Sample Cases
            </Link>
            <ThemeToggle className="h-8 w-8 p-1.5 rounded-lg" />
            <UserProfileMenu />
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all"
            >
              <span>Start New Claim</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Designed for Insurance Claims Adjusters &amp; Business Users</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0a1f44] dark:text-white leading-tight">
            Effortless auto accident claim review with evidence you can see.
          </h1>

          <p className="text-base sm:text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed">
            Drag and drop your claim documents and photographs. Verify automatically extracted accident details, scroll through evidence-backed findings on one page, and download a professional adjuster dossier.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/cases/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-md transition-all"
            >
              <span>Start New Claim</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-surface-700 dark:text-surface-200 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 transition-colors shadow-2xs"
            >
              <span>Explore 5 Sample Claims</span>
            </Link>
          </div>

          {/* Quick value highlights */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-xl bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-xs font-bold text-surface-900 dark:text-white">Evidence Beside Every Finding</div>
              <div className="text-[11px] text-surface-500">Photographs and documents are displayed directly next to conclusions.</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-xs font-bold text-surface-900 dark:text-white">One Scrolling Results Page</div>
              <div className="text-[11px] text-surface-500">No clicking across separate technical tabs to piece findings together.</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-800 space-y-1">
              <div className="text-xs font-bold text-surface-900 dark:text-white">Human Adjuster in Control</div>
              <div className="text-[11px] text-surface-500">Assistive decision support that never automatically approves or denies claims.</div>
            </div>
          </div>
        </section>

        {/* 5-Step Intuitive Journey Section */}
        <section className="py-12 bg-surface-0 dark:bg-surface-850 border-y border-surface-200/80 dark:border-surface-800">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
                One Intuitive Journey from Intake to Report
              </h2>
              <p className="text-xs sm:text-sm text-surface-500">
                Simple, fast, and completely transparent for insurance professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    Step 1
                  </span>
                  <UploadCloud className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Upload</h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Drag and drop First Notice of Loss, police reports, repair estimates, and vehicle damage photos together.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    Step 2
                  </span>
                  <FileCheck2 className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Confirm Details</h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Verify extracted accident dates, locations, and policy details. Edit any field while source provenance is preserved.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    Step 3
                  </span>
                  <Search className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Investigate</h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Automatically analyze vehicle damage severity, check timeline consistency, and corroborate facts across all records.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    Step 4
                  </span>
                  <Camera className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Review Findings</h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Scroll down one unified dossier. See supporting photographs right next to damage observations and side-by-side discrepancies.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    Step 5
                  </span>
                  <Download className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Download Report</h3>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Download a court-ready, professional claims investigation PDF with NAIC compliance disclosures and action checklists.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Sample Insurance Scenarios Section */}
        <section className="py-16 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
              Try Five Realistic Insurance Scenarios
            </h2>
            <p className="text-xs sm:text-sm text-surface-500">
              Test how ClaimScope handles common auto collision claims, from minor parking incidents to complex contradictory narratives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Scenario A */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase">Case A</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-100 text-surface-700">1 Document</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Minor Parking Lot Incident</h3>
              <p className="text-xs text-surface-500">Single FNOL document submitted. Demonstrates routine review with partial records.</p>
              <div className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1 pt-1">
                <span>View Scenario</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Scenario B */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase">Case B</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">Photos Included</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Front Collision with Damage Photos</h3>
              <p className="text-xs text-surface-500">FNOL plus 2 scene photographs. Demonstrates component damage analysis and severity scoring.</p>
              <div className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1 pt-1">
                <span>View Scenario</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Scenario C */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase">Case C</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Complete Package</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Comprehensive Collision Package</h3>
              <p className="text-xs text-surface-500">Complete package: FNOL, police report, certified estimate, and photographs all corroborated.</p>
              <div className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1 pt-1">
                <span>View Scenario</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Scenario D */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase">Case D</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Contradictions</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Contradictory Narrative &amp; VIN Mismatch</h3>
              <p className="text-xs text-surface-500">Conflicting accident dates and VIN suffix discrepancy between FNOL and police report.</p>
              <div className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1 pt-1">
                <span>View Scenario</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Scenario E */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-850 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase">Case E</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Scanned Statement</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Incomplete Scanned Intake Form</h3>
              <p className="text-xs text-surface-500">Handwritten statement with missing information. Demonstrates uncertainty reporting.</p>
              <div className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1 pt-1">
                <span>View Scenario</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* All Scenarios Card */}
            <div
              onClick={() => router.push('/demo')}
              className="p-5 rounded-2xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-950/20 hover:bg-brand-50/60 transition-all cursor-pointer flex flex-col justify-center items-center text-center space-y-2"
            >
              <Layers className="h-8 w-8 text-brand-600" />
              <h3 className="text-sm font-bold text-brand-900 dark:text-brand-200">Open Evaluation Demo Lab</h3>
              <p className="text-xs text-surface-500">Compare all 5 claim scenarios side-by-side</p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Corporate Footer */}
      <footer className="border-t border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-[#0c1322] py-8 px-4 text-center text-xs text-surface-500 space-y-2">
        <div>ClaimScope • Auto Accident Claim Investigation Platform</div>
        <div className="text-[11px] text-surface-400">Strictly Confidential • Decision-Support System for Licensed Insurance Adjusters</div>
      </footer>
    </div>
  );
}
