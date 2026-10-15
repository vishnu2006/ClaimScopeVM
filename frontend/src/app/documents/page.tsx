'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  Camera,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
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
import { Document, DocumentType } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';

interface DocumentWithCase extends Document {
  case_number: string;
  case_title: string;
}

export default function DocumentIntelligencePage() {
  const router = useRouter();
  const { cases, loading: casesLoading } = useCases();

  const [allDocs, setAllDocs] = useState<DocumentWithCase[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Load documents across cases
  useEffect(() => {
    let mounted = true;
    if (!cases || cases.length === 0) {
      if (!casesLoading) setLoadingDocs(false);
      return;
    }

    setLoadingDocs(true);
    Promise.allSettled(
      cases.map(async (c) => {
        try {
          const docs = await api.getDocuments(c.id);
          return docs.map((d) => ({
            ...d,
            case_number: c.case_number,
            case_title: c.title,
          }));
        } catch {
          return [] as DocumentWithCase[];
        }
      })
    ).then((results) => {
      if (!mounted) return;
      const combined: DocumentWithCase[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          combined.push(...res.value);
        }
      });
      setAllDocs(combined);
      setLoadingDocs(false);
    });

    return () => {
      mounted = false;
    };
  }, [cases, casesLoading]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return allDocs.filter((d) => {
      if (selectedType !== 'all' && d.document_type !== selectedType) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          d.original_filename.toLowerCase().includes(q) ||
          d.case_number.toLowerCase().includes(q) ||
          d.case_title.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allDocs, selectedType, searchTerm]);

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'fnol':
        return <FileText className="h-4 w-4 text-brand-600" />;
      case 'police_report':
        return <ShieldAlert className="h-4 w-4 text-purple-600" />;
      case 'repair_estimate':
        return <Wrench className="h-4 w-4 text-amber-600" />;
      case 'photo':
        return <Camera className="h-4 w-4 text-emerald-600" />;
      default:
        return <FileText className="h-4 w-4 text-surface-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Intelligence Registry"
        subtitle="Cross-case repository of ingested incident files, native text extractions, and vision scans"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Document Intelligence' },
        ]}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-0 border border-surface-200 rounded-lg p-3 shadow-subtle">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by file name or case number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs h-8.5"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-md border border-surface-300 bg-surface-0 px-2.5 py-1 text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Document Types</option>
              <option value="fnol">FNOL Forms</option>
              <option value="police_report">Police Reports</option>
              <option value="repair_estimate">Repair Estimates</option>
              <option value="photo">Damage Photos</option>
              <option value="other">Other / Scans</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {loadingDocs || casesLoading ? (
          <div className="space-y-4">
            <LoadingState variant="skeleton" count={1} />
            <LoadingState variant="card-skeleton" count={4} />
          </div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents located"
            description="Upload incident files to a claim case or run a scenario from the Demo Lab."
            actionLabel="View All Cases"
            onAction={() => router.push('/cases')}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-200 bg-surface-0 shadow-card">
            <table className="min-w-full divide-y divide-surface-200 text-left text-xs">
              <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Document Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Associated Case</th>
                  <th className="px-4 py-3.5">Size / Pages</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Uploaded</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-normal">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/cases/${doc.case_id}`)}
                    className="hover:bg-surface-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded bg-surface-100 shrink-0">
                          {getDocTypeIcon(doc.document_type)}
                        </div>
                        <span className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate max-w-xs">
                          {doc.original_filename}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-50 border border-surface-200 text-surface-800">
                        {doc.case_number}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-surface-600 font-mono text-[11px]">
                      {formatBytes(doc.file_size_bytes)}
                      {doc.page_count ? ` • ${doc.page_count} pg` : ''}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {doc.processing_status === 'completed' && (
                        <Badge variant="success" size="xs" dot>
                          Processed
                        </Badge>
                      )}
                      {doc.processing_status === 'pending' && (
                        <Badge variant="pending" size="xs">
                          Pending
                        </Badge>
                      )}
                      {doc.processing_status === 'processing' && (
                        <Badge variant="info" size="xs">
                          Processing
                        </Badge>
                      )}
                      {doc.processing_status === 'failed' && (
                        <Badge variant="error" size="xs" dot>
                          Failed
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-surface-500 text-xs">
                      {formatDate(doc.uploaded_at)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-surface-500 group-hover:text-brand-600 transition-colors">
                        <span>Inspect</span>
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
