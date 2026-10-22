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
  Eye,
  Download,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useCases } from '@/hooks/useCases';
import { api } from '@/lib/api';
import { Document, DocumentType } from '@/lib/types';
import { formatBytes, formatDate, formatDocumentType } from '@/lib/utils';

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
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentWithCase | null>(null);

  // Load documents across top cases with concurrency limit
  useEffect(() => {
    let mounted = true;
    if (!cases || cases.length === 0) {
      if (!casesLoading) {
        Promise.resolve().then(() => {
          if (mounted) setLoadingDocs(false);
        });
      }
      return;
    }

    Promise.resolve().then(() => {
      if (mounted) setLoadingDocs(true);
    });

    // Limit to latest 12 cases to keep page load sub-second
    const activeSample = cases.slice(0, 12);

    Promise.allSettled(
      activeSample.map(async (c) => {
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
      const aggregated: DocumentWithCase[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          aggregated.push(...res.value);
        }
      });
      setAllDocs(aggregated);
      setLoadingDocs(false);
    });

    return () => {
      mounted = false;
    };
  }, [cases, casesLoading]);

  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      const matchesSearch =
        searchTerm === '' ||
        doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.case_title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || doc.document_type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [allDocs, searchTerm, selectedType]);

  const docTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allDocs.length };
    allDocs.forEach((d) => {
      counts[d.document_type] = (counts[d.document_type] || 0) + 1;
    });
    return counts;
  }, [allDocs]);

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'fnol':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'police_report':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'repair_estimate':
        return <Wrench className="h-4 w-4 text-emerald-500" />;
      case 'photo':
        return <Camera className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-surface-500" />;
    }
  };

  const previewDoc = selectedDocForPreview;
  const previewFilename = (previewDoc?.original_filename || '').toLowerCase();
  const previewIsPdf = previewFilename.endsWith('.pdf') || (previewDoc?.mime_type || '').includes('pdf');
  const previewIsImage =
    previewFilename.endsWith('.jpg') ||
    previewFilename.endsWith('.jpeg') ||
    previewFilename.endsWith('.png') ||
    previewFilename.endsWith('.webp') ||
    (previewDoc?.mime_type || '').includes('image');
  const previewFileUrl =
    previewDoc?.case_id && previewDoc?.id ? api.getDocumentRawUrl(previewDoc.case_id, previewDoc.id) : '';

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Intelligence Registry"
        subtitle="Cross-case index of uploaded FNOL forms, official police reports, repair estimates, and photographs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Document Intelligence' },
        ]}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search filename, case #, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-surface-400" />}
              className="text-xs"
            />
          </div>

          {/* Document Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'fnol', label: 'FNOL Forms' },
              { id: 'police_report', label: 'Police Reports' },
              { id: 'repair_estimate', label: 'Repair Estimates' },
              { id: 'photo', label: 'Photos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-surface-0 border border-surface-200 text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                }`}
              >
                {tab.label}{' '}
                <span className="ml-1 opacity-75 font-mono text-[10px]">
                  ({docTypeCounts[tab.id] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Table */}
        {loadingDocs ? (
          <LoadingState variant="skeleton" count={5} />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents match your query"
            description="Try modifying your keyword search or selected document category filter."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setSelectedType('all');
            }}
          />
        ) : (
          <div className="rounded-xl border border-surface-200 bg-surface-0 overflow-hidden shadow-subtle">
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
                    className="hover:bg-surface-50 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="p-1.5 rounded bg-surface-100 hover:bg-brand-50 hover:text-brand-600 shrink-0 cursor-pointer transition-colors"
                          title="Click to view file"
                        >
                          {getDocTypeIcon(doc.document_type)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="text-left font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate max-w-xs cursor-pointer"
                          title={doc.original_filename}
                        >
                          {doc.original_filename}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/cases/${doc.case_id}`}
                        className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-50 border border-surface-200 text-surface-800 hover:text-brand-600 hover:border-brand-300 transition-colors"
                      >
                        {doc.case_number}
                      </Link>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          leftIcon={<Eye className="h-3 w-3" />}
                          onClick={() => setSelectedDocForPreview(doc)}
                        >
                          Open File
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => router.push(`/cases/${doc.case_id}`)}
                          title="Open Case Workbench"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-app Document Viewer Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setSelectedDocForPreview(null)}
          title={previewDoc.original_filename}
          description={`Case: ${previewDoc.case_number} • ${formatDocumentType(previewDoc.document_type)} • Size: ${formatBytes(previewDoc.file_size_bytes)}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {previewFileUrl && (
                  <a
                    href={previewFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 p-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
                <Link
                  href={`/cases/${previewDoc.case_id}`}
                  className="text-xs text-surface-600 hover:text-surface-900 underline ml-2"
                >
                  View Case Workbench
                </Link>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedDocForPreview(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="rounded-lg border border-surface-200 bg-surface-100/50 flex flex-col items-center justify-center min-h-[420px] max-h-[75vh] overflow-hidden">
            {previewIsImage && previewFileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewFileUrl}
                alt={previewDoc.original_filename}
                className="max-h-[70vh] w-auto object-contain rounded p-2"
              />
            ) : previewIsPdf && previewFileUrl ? (
              <iframe
                src={`${previewFileUrl}#toolbar=1&navpanes=0`}
                title={previewDoc.original_filename}
                className="w-full h-[68vh] border-0 rounded bg-white"
              />
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-surface-200 text-surface-600">
                  {getDocTypeIcon(previewDoc.document_type)}
                </div>
                <div>
                  <h5 className="font-semibold text-surface-800 text-sm">{previewDoc.original_filename}</h5>
                  <p className="text-xs text-surface-500 mt-1">
                    Direct in-browser inspection is ready.
                  </p>
                </div>
                {previewFileUrl && (
                  <a
                    href={previewFileUrl}
                    download={previewDoc.original_filename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
