'use client';

import React from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Clock,
  ShieldCheck,
  Building2,
  CloudRain,
  DollarSign,
} from 'lucide-react';
import { WebVerificationResult } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ExternalVerificationListProps {
  verifications: WebVerificationResult[];
}

export function ExternalVerificationList({ verifications }: ExternalVerificationListProps) {
  if (verifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-8 text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
          <Globe className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-surface-800">
          No External Verifications Performed
        </h4>
        <p className="text-xs text-surface-500 max-w-md mx-auto">
          External verification is selectively invoked by the LangGraph supervisor when verifiable parameters
          (17-character VIN, specific incident weather conditions, or itemized repair costs) are present.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            VERIFIED
          </Badge>
        );
      case 'inconclusive':
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="h-3 w-3 mr-1" />
            INCONCLUSIVE
          </Badge>
        );
      case 'source_unavailable':
        return (
          <Badge variant="default" size="sm">
            <HelpCircle className="h-3 w-3 mr-1 text-surface-400" />
            SOURCE UNAVAILABLE
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const getSourceIcon = (sourceName: string) => {
    const s = sourceName.toLowerCase();
    if (s.includes('nhtsa') || s.includes('vin')) {
      return <Building2 className="h-4 w-4 text-brand-600" />;
    }
    if (s.includes('weather') || s.includes('meteo')) {
      return <CloudRain className="h-4 w-4 text-sky-600" />;
    }
    if (s.includes('repair') || s.includes('benchmark') || s.includes('cost')) {
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
    return <Globe className="h-4 w-4 text-surface-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-surface-900">
            Selective External Grounding &amp; Verifications ({verifications.length})
          </h3>
          <p className="text-xs text-surface-500">
            Authoritative public government registries, historical meteorological archives, and collision benchmarks
          </p>
        </div>
      </div>

      {/* Regulatory Context Notice */}
      <div className="rounded-md border border-brand-200 bg-brand-50/50 p-3 flex items-start gap-2.5 text-xs text-brand-900">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-700 mt-0.5" />
        <span>
          <strong>Grounding Principle:</strong> External inquiries are performed strictly through public government APIs and validated reference databases. General model knowledge is never passed off as retrieved external evidence.
        </span>
      </div>

      <div className="space-y-3">
        {verifications.map((ver, idx) => (
          <Card key={ver.verification_id || idx} className="border-surface-200 shadow-subtle">
            <CardHeader className="pb-2.5 border-b border-surface-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-surface-100 shrink-0">
                    {getSourceIcon(ver.source_name)}
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-surface-900">
                      {ver.verification_question}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold text-brand-800">
                        {ver.source_name}
                      </span>
                      {ver.source_url && (
                        <a
                          href={ver.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-surface-400 hover:text-brand-600 flex items-center gap-0.5 underline"
                        >
                          <span className="truncate max-w-xs">{ver.source_url}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {ver.grounded_cost_range && (
                    <span className="font-mono text-xs font-bold text-surface-900 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                      Benchmark: {ver.grounded_cost_range}
                    </span>
                  )}
                  {getStatusBadge(ver.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-2.5 text-xs">
              <div className="rounded bg-surface-50 p-3 border border-surface-200">
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block mb-1">
                  Retrieved Authority Response:
                </span>
                <p className="text-surface-800 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                  {ver.retrieved_information}
                </p>
              </div>

              {ver.applicability_and_limitations && (
                <div className="text-[11px] text-surface-500 flex items-start gap-1.5 italic">
                  <span className="font-semibold not-italic">Scope Note:</span>
                  <span>{ver.applicability_and_limitations}</span>
                </div>
              )}

              {ver.retrieval_timestamp && (
                <div className="flex items-center gap-1.5 text-[10px] text-surface-400 pt-1 border-t border-surface-100">
                  <Clock className="h-3 w-3" />
                  <span>Timestamp: {ver.retrieval_timestamp}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
