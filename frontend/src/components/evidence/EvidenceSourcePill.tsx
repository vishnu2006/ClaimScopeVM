'use client';

import React, { useState } from 'react';
import { FileText, Camera, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EvidenceSourcePillProps {
  sourceName?: string | null;
  page?: number | null;
  excerpt?: string | null;
  isPhoto?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EvidenceSourcePill: React.FC<EvidenceSourcePillProps> = ({
  sourceName,
  page,
  excerpt,
  isPhoto,
  className,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!sourceName) return null;

  // Clean filename for display (remove uuid prefix if present)
  const displayName = sourceName.replace(/^[0-9a-f]{32}_/, '').replace(/^.*[\\\/]/, '');

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer',
          isPhoto
            ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100'
            : 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/60',
          onClick && 'hover:shadow-2xs active:scale-98',
          className
        )}
        title={onClick ? 'Click to inspect source evidence' : undefined}
      >
        {isPhoto ? (
          <Camera className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
        ) : (
          <FileText className="h-3 w-3 shrink-0 text-brand-600 dark:text-brand-400" />
        )}
        <span className="truncate max-w-[170px]">{displayName}</span>
        {page && (
          <span className="opacity-75 text-[10px]">p.{page}</span>
        )}
        {onClick && (
          <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
        )}
      </button>

      {/* Interactive Tooltip Preview on Hover */}
      {showTooltip && (excerpt || page) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-40 w-64 max-w-xs p-2.5 rounded-lg bg-surface-900 text-white text-[11px] leading-relaxed shadow-xl border border-surface-700 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between text-[10px] text-surface-400 font-semibold mb-1 pb-1 border-b border-surface-700">
            <span className="truncate">{displayName}</span>
            {page && <span>Page {page}</span>}
          </div>
          {excerpt ? (
            <p className="font-serif italic text-surface-200 line-clamp-3">
              “{excerpt}”
            </p>
          ) : (
            <p className="text-surface-400">Click to view source evidence document.</p>
          )}
          <div className="text-[9px] text-brand-400 font-semibold mt-1">Click pill to open document</div>
        </div>
      )}
    </div>
  );
};
