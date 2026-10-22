'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CreateCaseForm } from '@/components/cases/CreateCaseForm';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NewCasePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="New Incident File Intake"
        subtitle="Initiate an auto insurance investigation file and prepare multi-document intake"
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Claims', href: '/cases' },
          { label: 'New Claim Intake' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/demo')}
            leftIcon={<FlaskConical className="h-4 w-4 text-brand-600" />}
          >
            Load Evaluation Demo
          </Button>
        }
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <CreateCaseForm
          onSuccess={(caseId) => router.push(`/cases/${caseId}`)}
          onCancel={() => router.push('/cases')}
        />
      </div>
    </div>
  );
}
