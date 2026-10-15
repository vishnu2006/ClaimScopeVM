'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { CaseSummary } from '@/lib/types';
import { CaseCard } from './CaseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export interface CaseListProps {
  cases: CaseSummary[] | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  loading,
  error,
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
        title="No cases yet"
        description="Create your first auto claim case to begin an investigation with multi-document reasoning."
        actionLabel="Create New Case"
        onAction={() => router.push('/cases/new')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cases.map((caseItem) => (
        <CaseCard key={caseItem.id} caseItem={caseItem} />
      ))}
    </div>
  );
};
