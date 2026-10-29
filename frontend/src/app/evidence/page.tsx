'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { Evidence } from '@/lib/types';

interface EvidenceWithCase extends Evidence {
  case_number: string;
  case_title: string;
}

export default function EvidenceAnalysisPage() {
  const router = useRouter();
  const { cases, loading: casesLoading } = useCases();

  const [allEvidences, setAllEvidences] = useState<EvidenceWithCase[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [conflictsOnly, setConflictsOnly] = useState(false);

  // Fetch evidence across cases
  useEffect(() => {
    let mounted = true;
    if (!cases || cases.length === 0) {
      if (!casesLoading) {
        Promise.resolve().then(() => {
          if (mounted) setLoadingEvidences(false);
        });
      }
      return;
    }

    Promise.resolve().then(() => {
      if (mounted) setLoadingEvidences(true);
    });

    const activeSample = cases.slice(0, 12);

    Promise.allSettled(
      activeSample.map(async (c) => {
        try {
          const evs = await api.getCaseEvidence(c.id);
          return evs.map((e) => ({
            ...e,
            case_number: c.case_number,
            case_title: c.title,
          }));
        } catch {
          return [] as EvidenceWithCase[];
        }
      })
    ).then((results) => {
      if (!mounted) return;
      const combined: EvidenceWithCase[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          combined.push(...res.value);
        }
      });
      setAllEvidences(combined);
      setLoadingEvidences(false);
    });

    return () => {
      mounted = false;
    };
  }, [cases, casesLoading]);

  // Categories set
  const categories = useMemo(() => {
    const set = new Set<string>();
    allEvidences.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [allEvidences]);
     // print("chokli gay");
  // Filtered evidence
  const filteredEvidences = useMemo(() => {
    return allEvidences.filter((e) => {
      if (conflictsOnly && !e.is_conflicting) return false;
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          e.field_name.toLowerCase().includes(q) ||
          (e.field_value && e.field_value.toLowerCase().includes(q)) ||
          e.case_number.toLowerCase().includes(q) ||
          (e.source_document && e.source_document.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allEvidences, selectedCategory, conflictsOnly, searchTerm]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Evidence &amp; Provenance Analysis"
        subtitle="Cross-case fact registry with source citations, page references, and extraction confidence"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Evidence Analysis' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-0 border border-surface-200 rounded-lg p-3 shadow-subtle">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search field, value, or case #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs h-8.5"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <span>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer capitalize"
              >
                <option value="all">All Categories ({allEvidences.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium text-surface-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={conflictsOnly}
                onChange={(e) => setConflictsOnly(e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Conflicts Only
              </span>
            </label>
          </div>
        </div>

        {/* Content Table */}
        {loadingEvidences || casesLoading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={4} />
          </div>
        ) : filteredEvidences.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No evidence records matched"
            description="Adjust your search filters or run an investigation on an ingested claim package."
            actionLabel="View All Cases"
            onAction={() => router.push('/cases')}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-card">
            <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
              <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Fact Field</th>
                  <th className="px-4 py-3.5">Extracted Value</th>
                  <th className="px-4 py-3.5">Case ID</th>
                  <th className="px-4 py-3.5">Source Provenance</th>
                  <th className="px-4 py-3.5 text-center">Confidence</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-normal">
                {filteredEvidences.map((ev) => {
                  const confPct = ev.confidence !== null && ev.confidence !== undefined ? Math.round(ev.confidence * 100) : null;

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => router.push(`/cases/${ev.case_id}`)}
                      className={`hover:bg-surface-50 transition-colors cursor-pointer group ${
                        ev.is_conflicting ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                          {ev.category.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-surface-900 font-medium">
                        <div className="flex items-center gap-1.5">
                          {ev.is_conflicting && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          )}
                          <span>{ev.field_name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-surface-900 font-medium max-w-xs truncate">
                        {ev.field_value || <span className="text-surface-400 italic">None</span>}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-50 border border-surface-200 text-surface-800">
                          {ev.case_number}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-surface-600 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-surface-400" />
                          <span className="truncate max-w-[140px]">{ev.source_document || 'Unspecified'}</span>
                          {ev.source_page && <span className="text-surface-400">p.{ev.source_page}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        {confPct !== null ? (
                          <span
                            className={`font-mono text-xs font-semibold ${
                              confPct >= 80 ? 'text-emerald-700' : confPct >= 50 ? 'text-amber-700' : 'text-rose-700'
                            }`}
                          >
                            {confPct}%
                          </span>
                        ) : (
                          <span className="text-surface-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-surface-500 group-hover:text-brand-600 transition-colors">
                          <span>Inspect</span>
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
