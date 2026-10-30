'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Camera, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export interface PhotoItem {
  url: string;
  title: string;
  region?: string;
  severity?: string;
  notes?: string;
}

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  region?: string;
  severity?: string;
  notes?: string;
  photos?: PhotoItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  region,
  severity,
  notes,
  photos = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Reset zoom on photo change or open
  useEffect(() => {
    setZoomLevel(1);
  }, [imageUrl, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (photos.length > 1 && onNavigate) {
        if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
          onNavigate(currentIndex + 1);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      }
    };

    if (typeof window !== 'undefined') {
      if (isOpen) {
        window.document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen, onClose, photos, currentIndex, onNavigate]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, +(z + 0.5).toFixed(1)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, +(z - 0.5).toFixed(1)));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged Photograph Preview"
    >
      <div
        className="relative max-w-5xl w-full max-h-[94vh] flex flex-col bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Camera className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                  {title}
                </h3>
                {photos.length > 1 && (
                  <span className="text-[11px] font-mono text-surface-500 bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                    {currentIndex + 1} / {photos.length}
                  </span>
                )}
              </div>
              {region && (
                <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
                  <span>Area: <strong className="text-surface-700 dark:text-surface-300">{region}</strong></span>
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

          {/* Controls: Zoom, Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center border border-surface-200 dark:border-surface-750 rounded-lg p-0.5 bg-surface-0 dark:bg-surface-800 mr-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.75}
                className="p-1 rounded text-surface-500 hover:text-surface-900 dark:hover:text-white disabled:opacity-40 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-[10px] font-mono text-surface-600 dark:text-surface-300 hover:text-brand-600"
                title="Reset Zoom"
              >
                {(zoomLevel * 100).toFixed(0)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 rounded text-surface-500 hover:text-surface-900 dark:hover:text-white disabled:opacity-40 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Download photo"
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

        {/* Modal Body: Image Preview with Navigation Chevrons */}
        <div className="relative flex-1 bg-surface-950 flex items-center justify-center p-4 min-h-[360px] max-h-[72vh] overflow-hidden select-none">
          {/* Previous Photo Button */}
          {photos.length > 1 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white transition-all shadow-lg backdrop-blur-xs cursor-pointer"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Next Photo Button */}
          {photos.length > 1 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white transition-all shadow-lg backdrop-blur-xs cursor-pointer"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="overflow-auto max-h-[68vh] max-w-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 150ms ease-out' }}
              className="max-w-full max-h-[66vh] object-contain rounded-lg shadow-2xl origin-center"
            />
          </div>
        </div>

        {/* Modal Footer: Observations / Notes */}
        {notes && (
          <div className="px-5 py-3 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850 text-xs text-surface-600 dark:text-surface-400">
            <span className="font-semibold text-surface-800 dark:text-surface-200">Investigation Note: </span>
            {notes}
          </div>
        )}
      </div>
    </div>
  );
};
