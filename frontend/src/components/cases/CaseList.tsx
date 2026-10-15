'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { CaseSummary } from '@/lib/types';
import { CaseCard } from './CaseCard';
import { RecentCasesTable } from './RecentCasesTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export interface CaseListProps {
  cases: CaseSummary[] | null;
  loading: boolean;
  error: string | null;
  viewMode?: 'table' | 'grid';
  onRetry?: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  loading,
  error,
  viewMode = 'table',
  onRetry,
}) => {
  const router = useRouter();

  if (loading) {
    return <LoadingState variant="card-skeleton" count={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Cases"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <EmptyState
        icon={FolderPlus}
        title="No matching claims found"
        description="Try adjusting your search criteria or create a new claim case."
        actionLabel="Create New Case"
        onAction={() => router.push('/cases/new')}
      />
    );
  }

  if (viewMode === 'table') {
    return <RecentCasesTable cases={cases} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cases.map((caseItem) => (
        <CaseCard key={caseItem.id} caseItem={caseItem} />
      ))}
    </div>
  );
};
