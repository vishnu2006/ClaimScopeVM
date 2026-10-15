'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  FolderOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CaseCard } from '@/components/cases/CaseCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatStatus } from '@/lib/utils';
import { CaseStatus } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();

  // Compute status aggregates strictly from real data
  const totalCases = cases ? cases.length : 0;

  const statusCounts = React.useMemo(() => {
    if (!cases) return {} as Record<CaseStatus, number>;
    return cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<CaseStatus, number>);
  }, [cases]);

  // Sort recent cases by created_at descending, take 5
  const recentCases = React.useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Welcome Banner */}
      <section className="border-b border-surface-200 bg-surface-0 px-6 py-8 shadow-subtle">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-brand-50 text-brand-700 text-xs font-semibold mb-1">
              <Shield className="h-3.5 w-3.5" />
              <span>US P&amp;C Auto Claim Investigation Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900">
              ClaimScope Investigation Hub
            </h1>
            <p className="text-sm text-surface-500 max-w-2xl leading-relaxed">
              Multi-document AI pipeline designed for insurance adjustors. Ingest incident packages, extract structured damage details, cross-check inconsistencies, and ground costs with real-time web verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/cases/new')}
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Create New Case
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {loading ? (
          <div className="space-y-6">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={3} />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Dashboard Data"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            {/* Quick Stats Grid - Derived strictly from API */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase text-surface-500 tracking-wider">
                    Total Active Cases
                  </span>
                  <div className="text-2xl font-bold text-surface-900 mt-1">
                    {totalCases}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5" />
                </div>
              </Card>

              {/* Only show status cards if > 0 */}
              {Object.entries(statusCounts).map(([status, count]) => {
                if (count <= 0) return null;
                const isFlagged = status === 'flagged';
                const isCompleted = status === 'completed';
                const isReview = status === 'in_review' || status === 'in_progress';

                return (
                  <Card key={status} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-surface-500 tracking-wider">
                        {formatStatus(status)}
                      </span>
                      <div className="text-2xl font-bold text-surface-900 mt-1">
                        {count}
                      </div>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isFlagged
                          ? 'bg-amber-50 text-amber-600'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : isReview
                          ? 'bg-blue-50 text-brand-600'
                          : 'bg-surface-100 text-surface-600'
                      }`}
                    >
                      {isFlagged ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Recent Cases Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-surface-900">
                    Recent Investigation Cases
                  </h2>
                  <p className="text-xs text-surface-500">
                    Latest accident claims submitted to the intake pipeline
                  </p>
                </div>
                {totalCases > 0 && (
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    <span>View all cases ({totalCases})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {recentCases.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No cases created yet"
                  description="Begin your first auto claim investigation by creating a new case and uploading accident documents."
                  actionLabel="Create New Case"
                  onAction={() => router.push('/cases/new')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentCases.map((caseItem) => (
                    <CaseCard key={caseItem.id} caseItem={caseItem} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
