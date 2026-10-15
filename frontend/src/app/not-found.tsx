import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-4 shadow-subtle">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <span className="font-mono text-xs font-bold text-brand-600 tracking-wider uppercase mb-1">
        404 — Not Found
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-surface-900 mb-2">
        Investigation Record Not Found
      </h1>
      <p className="text-xs text-surface-500 max-w-sm mb-6 leading-relaxed">
        The requested case, file, or page could not be located in the ClaimScope repository.
      </p>
      <Link href="/">
        <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
