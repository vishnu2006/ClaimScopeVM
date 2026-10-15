'use client';

import React from 'react';
import { Files } from 'lucide-react';
import { Document } from '@/lib/types';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

export interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onProcess?: (docId: string) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading = false,
  onProcess,
  onDelete,
  className,
}) => {
  if (loading) {
    return <LoadingState variant="skeleton" count={3} className={className} />;
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={Files}
        title="No incident documents uploaded yet"
        description="Upload FNOL forms, damage photos, or police reports to begin automated document AI extraction."
        className={className}
      />
    );
  }

  return (
    <div className={className || 'space-y-3'}>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onProcess={onProcess}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
