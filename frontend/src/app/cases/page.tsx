'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CaseList } from '@/components/cases/CaseList';

export default function CasesPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.claimant_name && c.claimant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.policy_number && c.policy_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'all' || c.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchTerm, selectedStatus]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Claim Cases"
        subtitle="Manage and investigate auto accident claim packages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Cases' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/cases/new')}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            New Case
          </Button>
        }
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-0 border border-surface-200 rounded-lg p-3 shadow-subtle">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by case number, title, claimant or policy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium shrink-0">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1.5 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="flagged">Flagged</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Case List Grid */}
        <CaseList
          cases={filteredCases}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
