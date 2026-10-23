'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Info,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const { signUpWithEmail, signInWithGoogle, isConfigured, authError, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  // Password rules validation
  const hasLength = password.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!displayName.trim()) {
      setLocalError('Please enter your full name or investigator identifier.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter a valid business email address.');
      return;
    }
    if (!hasLength) {
      setLocalError('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(email, password, displayName);
      
      router.push(redirectPath);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create investigator account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      router.push(redirectPath);
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in was interrupted.');
    } finally {
      setGoogleLoading(false);
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
          Create Investigator Account
        </h1>
        <p className="text-xs text-surface-500 mt-1.5">
          Join your organization&apos;s multimodal claim investigation platform
        </p>
      </div>

      {/* Auth Card */}
      <div className="rounded-2xl border border-surface-200/90 dark:border-surface-700/80 bg-surface-0 dark:bg-[#121826] p-7 shadow-card">
        {/* Verification Success Screen */}
        {verificationSent ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                Account Created Successfully
              </h2>
              <p className="text-xs text-surface-600 dark:text-surface-400 max-w-xs mx-auto">
                A verification link has been dispatched to <strong className="text-surface-800 dark:text-surface-200">{email}</strong>.
              </p>
            </div>
            <div className="p-3 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900/60 text-[11px] text-brand-700 dark:text-brand-300">
              Redirecting you to your claim investigation workspace in a moment...
            </div>
          </div>
        ) : (
          <>
            {/* Unconfigured Firebase Notice */}
            {!isConfigured && (
              <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Firebase credentials pending</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Set up your Firebase project keys in <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]">frontend/.env.local</code> to activate live authentication.
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {displayError && (
              <div className="mb-5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <p className="flex-1 font-medium">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Investigator / Display Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                >
                  Investigator Name / Title <span className="text-status-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none" />
                  <input
                    id="displayName"
                    type="text"
                    required
                    autoFocus
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins, SIU Lead"
                    className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                >
                  Corporate Email <span className="text-status-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@insurance-co.com"
                    className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                >
                  Create Password <span className="text-status-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 pl-9 pr-10 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                >
                  Confirm Password <span className="text-status-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-surface-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 pl-9 pr-10 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer p-0.5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="p-3 bg-surface-50 dark:bg-surface-900/60 rounded-lg border border-surface-200 dark:border-surface-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-3 w-3 rounded-full flex items-center justify-center text-[8px] text-white ${
                        hasLength ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={hasLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-surface-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-3 w-3 rounded-full flex items-center justify-center text-[8px] text-white ${
                        hasNumberOrSymbol ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        hasNumberOrSymbol
                          ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                          : 'text-surface-500'
                      }
                    >
                      Contains a number or symbol
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-3 w-3 rounded-full flex items-center justify-center text-[8px] text-white ${
                          passwordsMatch ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {passwordsMatch ? '✓' : '×'}
                      </span>
                      <span
                        className={
                          passwordsMatch
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-rose-600 dark:text-rose-400 font-medium'
                        }
                      >
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="vm-primary"
                size="lg"
                className="w-full justify-center !py-2.5 font-bold mt-2"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Registering investigator...</span>
                  </>
                ) : (
                  <>
                    <span>Create Investigator Account</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200 dark:border-surface-800" />
              </div>
              <span className="relative bg-surface-0 dark:bg-[#121826] px-3 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                or continue with
              </span>
            </div>

            {/* Secondary Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading || !isConfigured}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-800/60 hover:bg-surface-50 dark:hover:bg-surface-800 px-4 py-2.5 text-xs font-semibold text-surface-800 dark:text-surface-100 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-surface-500" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Register with Google</span>
            </button>

            {/* Footer Link */}
            <div className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-800 text-center text-xs text-surface-500">
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-surface-50 dark:bg-[#0c1322]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12 text-sm text-surface-400">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        }
      >
        <SignUpForm />
      </Suspense>
    </div>
  );
}
