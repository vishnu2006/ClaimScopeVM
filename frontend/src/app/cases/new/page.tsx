'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CreateCaseForm } from '@/components/cases/CreateCaseForm';

export default function NewCasePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Create Investigation Case"
        subtitle="Initiate a new auto insurance accident case file for multi-document intake"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Cases', href: '/cases' },
          { label: 'New Case' },
        ]}
      />

      <div className="flex-1 max-w-4xl w-full mx-auto p-6">
        <CreateCaseForm
          onSuccess={(caseId) => router.push(`/cases/${caseId}`)}
          onCancel={() => router.push('/cases')}
        />
      </div>
    </div>
  );
}
