'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Search,
  Filter,
  LayoutGrid,
  List,
  FlaskConical,
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
        title="Claim Cases Registry"
        subtitle="Manage, search, and audit auto accident claim investigation packages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Cases' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/demo')}
              leftIcon={<FlaskConical className="h-3.5 w-3.5 text-brand-600" />}
            >
              Demo Lab
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/cases/new')}
              leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
            >
              New Intake
            </Button>
          </div>
        }
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Filters and View Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-0 border border-surface-200 rounded-lg p-2.5 shadow-subtle">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search case ID, claimant, policy, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <Filter className="h-3.5 w-3.5 text-surface-400" />
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All ({cases?.length || 0})</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="flagged">Flagged</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-surface-200 rounded-md p-0.5 bg-surface-50">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface-0 text-brand-600 shadow-xs'
                    : 'text-surface-400 hover:text-surface-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid view"
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface-0 text-brand-600 shadow-xs'
                    : 'text-surface-400 hover:text-surface-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Case List Display */}
        <CaseList
          cases={filteredCases}
          loading={loading}
          error={error}
          viewMode={viewMode}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
