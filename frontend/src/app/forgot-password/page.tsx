'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

function ForgotPasswordForm() {
  const { sendPasswordReset, isConfigured, authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-logo-container shadow-md group-hover:scale-105 transition-transform p-1.5">
            <Image
              src="/brand/vmlogo.png"
              alt="ClaimScope"
              width={34}
              height={34}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-extrabold tracking-tight text-[#0a1f44] dark:text-white leading-tight">
              ClaimScope
            </span>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
              Claims Decision Support
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
          Reset your password
        </h1>
        <p className="text-xs text-surface-500 mt-1.5">
          We&apos;ll send secure instructions to regain access to your workspace
        </p>
      </div>

      {/* Reset Card */}
      <div className="rounded-2xl border border-surface-200/90 dark:border-surface-700/80 bg-surface-0 dark:bg-[#121826] p-7 shadow-card">
        {submitted ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                Password Reset Email Dispatched
              </h2>
              <p className="text-xs text-surface-600 dark:text-surface-400 max-w-xs mx-auto leading-relaxed">
                If an account exists for <strong className="text-surface-800 dark:text-surface-200">{email}</strong>, you will receive an email shortly with a link to reset your password.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/login" className="inline-block w-full">
                <Button variant="vm-primary" size="md" className="w-full justify-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Return to Sign In</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {!isConfigured && (
              <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Firebase configuration is pending. Password reset emails require active project credentials.
                </p>
              </div>
            )}

            {displayError && (
              <div className="mb-5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <p className="flex-1 font-medium">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                >
                  Account Email Address <span className="text-status-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@insurer.com"
                    className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="vm-primary"
                size="lg"
                className="w-full justify-center !py-2.5 font-bold mt-2"
                disabled={loading || !isConfigured}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Dispatching reset link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-800 text-center text-xs">
              <Link
                href="/login"
                className="inline-flex items-center text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-surface-50 dark:bg-[#0c1322]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12 text-sm text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
