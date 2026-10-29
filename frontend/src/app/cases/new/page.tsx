'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ClaimIntakeFlow } from '@/components/intake/ClaimIntakeFlow';

export default function NewCasePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Start New Claim Review"
        subtitle="Upload your accident package, verify extracted details, and run investigation"
        breadcrumbs={[
          { label: 'Claims', href: '/cases' },
          { label: 'New Claim' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ClaimIntakeFlow />
      </div>
    </div>
  );
}
