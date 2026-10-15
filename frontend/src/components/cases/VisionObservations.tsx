'use client';

import React from 'react';
import { Camera } from 'lucide-react';
import { PhotoDamageAnalysis } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface VisionObservationsProps {
  observations: Record<string, PhotoDamageAnalysis>;
}

export function VisionObservations({ observations }: VisionObservationsProps) {
  const photoEntries = Object.entries(observations);

  if (photoEntries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-300 p-8 text-center space-y-3 bg-surface-50">
        <div className="mx-auto w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-surface-800">No Photographic Evidence Analyzed</h4>
          <p className="text-xs text-surface-500 max-w-md mx-auto mt-1">
            Upload accident scene or vehicle damage photos to invoke the Vehicle Damage Vision Agent.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'minor':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'severe':
      case 'catastrophic_total_loss':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-surface-900">
            Vehicle Damage Vision Analysis ({photoEntries.length} Photos)
          </h3>
          <p className="text-xs text-surface-500">
            Grounded visual physical damage assessment generated via Google Gemini multimodal vision
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {photoEntries.map(([docId, vision], idx) => (
          <Card key={docId} className="border-surface-200">
            <CardHeader className="pb-3 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-brand-50 text-brand-600">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-surface-900">
                      Photo {idx + 1}: {vision.visible_vehicle_region}
                    </CardTitle>
                    <span className="text-[10px] font-mono text-surface-400">ID: {docId.slice(0, 8)}</span>
                  </div>
                </div>

                <Badge variant={getSeverityBadgeVariant(vision.severity_category)} size="sm">
                  {vision.severity_category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3.5 text-xs">
              {/* Severity & Grounded Rubric */}
              <div className="rounded-md bg-surface-50 p-2.5 border border-surface-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-surface-700">Apparent Severity:</span>
                  <span className="font-mono text-[11px] text-surface-500">
                    Confidence: {(vision.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-surface-600 leading-relaxed">{vision.severity_explanation}</p>
              </div>

              {/* Observable Physical Damage */}
              {vision.observable_damage && vision.observable_damage.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-surface-700 block">Observable Manifestations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vision.observable_damage.map((dmg, i) => (
                      <span
                        key={i}
                        className="rounded px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px]"
                      >
                        {dmg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Impacted Components */}
              {vision.affected_components && vision.affected_components.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-surface-700 block">Impacted Vehicle Components:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vision.affected_components.map((comp, i) => (
                      <span
                        key={i}
                        className="rounded px-2 py-0.5 bg-surface-100 border border-surface-200 text-surface-700 text-[11px]"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Context & Image Limitations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-surface-100 text-[11px]">
                {vision.supporting_visual_observations?.length > 0 && (
                  <div>
                    <span className="text-surface-500 font-medium block mb-0.5">Observations:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-surface-600">
                      {vision.supporting_visual_observations.map((obs, i) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {vision.image_quality_limitations?.length > 0 && (
                  <div>
                    <span className="text-surface-500 font-medium block mb-0.5">Image Limitations:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-surface-500 italic">
                      {vision.image_quality_limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
