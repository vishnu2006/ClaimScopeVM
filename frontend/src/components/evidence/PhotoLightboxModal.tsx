'use client';

import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, Camera } from 'lucide-react';

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  region?: string;
  severity?: string;
  notes?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  region,
  severity,
  notes,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged Photograph Preview"
    >
      <div
        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Camera className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                {title}
              </h3>
              {region && (
                <div className="flex items-center gap-2 text-xs text-surface-500">
                  <span>Region: <strong className="text-surface-700 dark:text-surface-300">{region}</strong></span>
                  {severity && (
                    <>
                      <span>•</span>
                      <span className="capitalize">Severity: <strong className="text-surface-700 dark:text-surface-300">{severity}</strong></span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Download full photograph"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Image Preview */}
        <div className="flex-1 bg-surface-950/90 flex items-center justify-center p-4 min-h-[300px] max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[66vh] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Modal Footer: Observations / Notes */}
        {notes && (
          <div className="px-5 py-3 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850 text-xs text-surface-600 dark:text-surface-400">
            <span className="font-semibold text-surface-700 dark:text-surface-300">Observation Notes: </span>
            {notes}
          </div>
        )}
      </div>
    </div>
  );
};
