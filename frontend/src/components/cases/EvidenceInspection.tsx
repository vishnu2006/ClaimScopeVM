'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Evidence } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface EvidenceInspectionProps {
  evidences: Evidence[];
}

export function EvidenceInspection({ evidences }: EvidenceInspectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyConflicting, setOnlyConflicting] = useState(false);
  const [inspectModalEvidence, setInspectModalEvidence] = useState<Evidence | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    evidences.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [evidences]);

  // Filtered evidence items
  const filteredEvidences = useMemo(() => {
    return evidences.filter((ev) => {
      // Category filter
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
        return false;
      }
      // Conflicting filter
      if (onlyConflicting && !ev.is_conflicting) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesField = ev.field_name.toLowerCase().includes(q);
        const matchesVal = (ev.field_value || '').toLowerCase().includes(q);
        const matchesDoc = (ev.source_document || '').toLowerCase().includes(q);
        const matchesCategory = ev.category.toLowerCase().includes(q);
        if (!matchesField && !matchesVal && !matchesDoc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [evidences, selectedCategory, onlyConflicting, searchQuery]);

  const handleCopyValue = (ev: Evidence) => {
    if (ev.field_value) {
      navigator.clipboard.writeText(ev.field_value);
      setCopiedId(ev.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (evidences.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-300 p-8 text-center space-y-3 bg-surface-50">
        <Search className="h-6 w-6 text-surface-400 mx-auto" />
        <h4 className="text-sm font-semibold text-surface-800">No Facts Extracted Yet</h4>
        <p className="text-xs text-surface-500 max-w-md mx-auto">
          Execute the adaptive investigation or upload incident documentation to extract structured, verifiable claims facts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-surface-900">
            Structured Evidence &amp; Provenance Matrix ({evidences.length} Total Facts)
          </h3>
          <p className="text-xs text-surface-500">
            Granular facts extracted from policy forms, police records, estimates, and metadata
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-surface-500">
            Showing {filteredEvidences.length} of {evidences.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-0 border border-surface-200 rounded-lg p-3 space-y-3 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-surface-400" />
            <input
              type="text"
              placeholder="Search field, value, category, or source document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-surface-200 bg-surface-50 focus:bg-surface-0 focus:outline-none focus:ring-1 focus:ring-brand-500 text-surface-900"
            />
          </div>

          {/* Conflict Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-surface-700 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={onlyConflicting}
              onChange={(e) => setOnlyConflicting(e.target.checked)}
              className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Conflicting Only
            </span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-surface-100">
          <span className="text-[11px] font-semibold text-surface-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-subtle'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            All ({evidences.length})
          </button>
          {categories.map((cat) => {
            const count = evidences.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-subtle'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {cat.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Evidence Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-subtle">
        <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
          <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Fact Field</th>
              <th className="px-4 py-3">Extracted Value</th>
              <th className="px-4 py-3">Source Provenance</th>
              <th className="px-4 py-3 text-center">Confidence</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filteredEvidences.map((ev) => {
              const conf = ev.confidence !== null && ev.confidence !== undefined ? ev.confidence : null;
              const confPct = conf !== null ? Math.round(conf * 100) : null;

              return (
                <tr
                  key={ev.id}
                  className={`hover:bg-surface-50/70 transition-colors ${
                    ev.is_conflicting ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-surface-700 capitalize text-[11px] px-2 py-0.5 rounded bg-surface-100 border border-surface-200">
                      {ev.category.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-surface-900 font-medium">
                    <div className="flex items-center gap-1.5">
                      {ev.is_conflicting && (
                        <span title="Conflicting record">
                          <AlertTriangle className="h-3 w-3 text-status-warning shrink-0" />
                        </span>
                      )}
                      <span>{ev.field_name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-surface-900 font-medium max-w-sm">
                    <div className="flex items-center gap-1.5 group">
                      <span className="truncate">{ev.field_value || <span className="text-surface-400 italic">None</span>}</span>
                      {ev.field_value && (
                        <button
                          type="button"
                          onClick={() => handleCopyValue(ev)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-surface-400 hover:text-brand-600 p-0.5 rounded"
                          title="Copy value"
                        >
                          {copiedId === ev.id ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-surface-600 font-mono text-[11px]">
                      <FileText className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{ev.source_document || 'Unspecified'}</span>
                      {ev.source_page && (
                        <span className="text-[10px] text-surface-400">p.{ev.source_page}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {confPct !== null ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-mono font-semibold text-[11px] ${
                            confPct >= 80
                              ? 'text-emerald-700'
                              : confPct >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {confPct}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-surface-400 font-mono text-[11px]">N/A</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectModalEvidence(ev)}
                      className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Provenance Modal */}
      {inspectModalEvidence && (
        <Modal
          isOpen={!!inspectModalEvidence}
          onClose={() => setInspectModalEvidence(null)}
          title={`Evidence Provenance: ${inspectModalEvidence.field_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-md bg-surface-50 p-3.5 border border-surface-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-surface-500 uppercase tracking-wider text-[10px]">
                  Category
                </span>
                <Badge variant="info" size="sm">
                  {inspectModalEvidence.category.toUpperCase()}
                </Badge>
              </div>

              <div>
                <span className="font-semibold text-surface-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  Extracted Fact Value
                </span>
                <p className="font-mono text-xs font-semibold text-surface-900 bg-surface-0 p-2 rounded border border-surface-200">
                  {inspectModalEvidence.field_value || 'None'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border border-surface-200 bg-surface-50 space-y-1">
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                  Source Document
                </span>
                <p className="font-medium text-surface-900">
                  {inspectModalEvidence.source_document || 'N/A'}
                </p>
                {inspectModalEvidence.source_page && (
                  <p className="text-[11px] text-surface-500">
                    Page: {inspectModalEvidence.source_page}
                  </p>
                )}
              </div>

              <div className="p-3 rounded border border-surface-200 bg-surface-50 space-y-1">
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                  Extraction Confidence
                </span>
                <p className="font-mono text-sm font-bold text-emerald-700">
                  {inspectModalEvidence.confidence !== null && inspectModalEvidence.confidence !== undefined
                    ? `${(inspectModalEvidence.confidence * 100).toFixed(0)}%`
                    : 'Not Scored'}
                </p>
                <p className="text-[10px] text-surface-400">Validated via Gemini structured extraction</p>
              </div>
            </div>

            {inspectModalEvidence.source_location && (
              <div>
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
                  Source Location Reference
                </span>
                <p className="font-mono text-[11px] text-surface-700 bg-surface-100 p-2 rounded">
                  {inspectModalEvidence.source_location}
                </p>
              </div>
            )}

            {inspectModalEvidence.notes && (
              <div>
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
                  Extraction Notes &amp; Provenance
                </span>
                <p className="text-surface-700 leading-relaxed bg-surface-50 p-2.5 rounded border border-surface-200">
                  {inspectModalEvidence.notes}
                </p>
              </div>
            )}

            {inspectModalEvidence.is_conflicting && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <span>Cross-Document Conflict Recorded</span>
                </div>
                <p className="text-[11px]">
                  This field values differed across submitted incident files. Check the Discrepancies tab for comparative analysis.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
