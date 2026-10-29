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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useCases } from '@/hooks/useCases';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaseCard } from '@/components/cases/CaseCard';
import { formatDate, formatPriority, formatStatus, getPriorityBadgeVariant, getStatusBadgeVariant } from '@/lib/utils';
import { CaseSummary } from '@/lib/types';

type SortField = 'case_number' | 'created_at' | 'priority' | 'document_count';
type SortOrder = 'asc' | 'desc';

export default function CasesPage() {
  const router = useRouter();
  const { cases, loading, error, refetch } = useCases();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const priorityWeights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const filteredAndSortedCases = useMemo(() => {
    if (!cases) return [];

    const result = cases.filter((c) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          c.title.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q) ||
          (c.claimant_name && c.claimant_name.toLowerCase().includes(q)) ||
          (c.policy_number && c.policy_number.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && c.priority !== selectedPriority) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'case_number') {
        comparison = a.case_number.localeCompare(b.case_number);
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'priority') {
        comparison = (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);
      } else if (sortField === 'document_count') {
        comparison = a.document_count - b.document_count;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [cases, searchTerm, selectedStatus, selectedPriority, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAndSortedCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedCases.slice(start, start + pageSize);
  }, [filteredAndSortedCases, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Claims History"
        subtitle="Review previously investigated auto claims, check evidence, and access reports"
        breadcrumbs={[
          { label: 'Claims' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/demo')}
              leftIcon={<FlaskConical className="h-4 w-4 text-brand-600" />}
            >
              Sample Claims
            </Button>
            <button
              type="button"
              onClick={() => router.push('/cases/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Claim</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Filters and Management Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-0 border border-surface-200 rounded-lg p-3.5 shadow-subtle">
          {/* Search box */}
          <div className="w-full md:w-96">
            <Input
              placeholder="Search by case #, title, claimant, or policy..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs h-9"
            />
          </div>

          {/* Filter dropdowns and View Toggle */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
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

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <span>Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-surface-200 rounded-md p-0.5 bg-surface-50">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
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
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
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

        {/* Main Content Area */}
        {loading ? (
          <div className="space-y-4">
            <LoadingState variant="card-skeleton" count={5} message="Loading claims registry..." />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Cases"
            message={error}
            onRetry={refetch}
          />
        ) : filteredAndSortedCases.length === 0 ? (
          <EmptyState
            title="No matching claims found"
            description="Adjust your search query or filters, or create a new claim case."
            actionLabel="Create New Claim"
            onAction={() => router.push('/cases/new')}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </div>
        ) : (
          /* Full-width Management Table */
          <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-card">
            <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
              <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:bg-surface-100/70 transition-colors"
                    onClick={() => handleSort('case_number')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Case ID</span>
                      <ArrowUpDown className="h-3 w-3 text-surface-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Loss Description</th>
                  <th className="px-4 py-3.5">Claimant</th>
                  <th className="px-4 py-3.5">Policy Number</th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:bg-surface-100/70 transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3 text-surface-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th
                    className="px-4 py-3.5 text-center cursor-pointer hover:bg-surface-100/70 transition-colors"
                    onClick={() => handleSort('document_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Files</span>
                      <ArrowUpDown className="h-3 w-3 text-surface-400" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:bg-surface-100/70 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="h-3 w-3 text-surface-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-normal">
                {paginatedCases.map((c) => {
                  const priorityVariant = getPriorityBadgeVariant(c.priority);
                  const statusVariant = getStatusBadgeVariant(c.status);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      className="group hover:bg-surface-50 transition-colors cursor-pointer"
                    >
                      {/* Case ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-surface-100 text-surface-800 border border-surface-200 group-hover:border-brand-300 transition-colors">
                          {c.case_number}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate">
                          {c.title}
                        </div>
                      </td>

                      {/* Claimant */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-surface-700">
                        {c.claimant_name ? (
                          <span className="font-medium text-surface-800">{c.claimant_name}</span>
                        ) : (
                          <span className="text-surface-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Policy */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {c.policy_number ? (
                          <span className="font-mono text-xs text-surface-700 bg-surface-50 px-2 py-0.5 rounded border border-surface-200">
                            {c.policy_number}
                          </span>
                        ) : (
                          <span className="text-surface-400 italic text-xs">None</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={priorityVariant} size="xs" dot>
                          {formatPriority(c.priority)}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={statusVariant} size="xs" dot>
                          {formatStatus(c.status)}
                        </Badge>
                      </td>

                      {/* Document count */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded">
                          <FileText className="h-3.5 w-3.5 text-surface-400" />
                          <span>{c.document_count}</span>
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-surface-500 text-xs">
                        {formatDate(c.created_at)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-surface-500 group-hover:text-brand-600 transition-colors">
                          <span>Workbench</span>
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination and Table Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-surface-200 bg-surface-50/70 text-xs text-surface-600">
              <div>
                Showing <strong className="text-surface-900">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
                <strong className="text-surface-900">{Math.min(totalItems, currentPage * pageSize)}</strong> of{' '}
                <strong className="text-surface-900">{totalItems}</strong> cases
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  leftIcon={<ChevronLeft className="h-3 w-3" />}
                >
                  Prev
                </Button>
                <span className="px-2 text-xs font-mono font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  rightIcon={<ChevronRight className="h-3 w-3" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
