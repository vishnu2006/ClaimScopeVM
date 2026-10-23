'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Mail,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function UserProfileMenu() {
  const {
    user,
    userProfile,
    loading,
    isConfigured,
    logout,
    resendVerificationEmail,
  } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push('/login');
  };

  const handleResendVerification = async () => {
    try {
      setResendingEmail(true);
      await resendVerificationEmail();
      setEmailSentNotice('Verification email sent! Check your inbox.');
      setTimeout(() => setEmailSentNotice(null), 6000);
    } catch (err: any) {
      setEmailSentNotice(err.message || 'Failed to send verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-surface-200 dark:bg-surface-700 animate-pulse" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-surface-700 dark:text-surface-200 hover:text-surface-900 px-3 py-1.5"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/signup" className="hidden sm:inline-block">
          <Button
            variant="vm-primary"
            size="sm"
            className="text-xs font-semibold px-3 py-1.5"
          >
            Create Account
          </Button>
        </Link>
      </div>
    );
  }

  // User is logged in
  const displayName =
    user.displayName || userProfile?.display_name || user.email?.split('@')[0] || 'Investigator';
  const email = user.email || userProfile?.email || '';
  const isEmailVerified = user.emailVerified;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700 bg-surface-0 dark:bg-[#121826] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label="User Account Menu"
        aria-expanded={menuOpen}
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={displayName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
            {initials}
          </div>
        )}
        <div className="hidden md:flex flex-col text-left max-w-[120px]">
          <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate leading-none">
            {displayName}
          </span>
          <span className="text-[10px] text-surface-400 truncate mt-0.5">
            {isEmailVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-surface-400 transition-transform duration-150" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-[#121826] shadow-modal z-50 p-2 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Info */}
          <div className="px-3 py-2.5 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-surface-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-surface-900 dark:text-surface-100 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-surface-500 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
              </div>
            </div>

            {/* Verification Status Pill */}
            <div className="mt-2.5 pt-2 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-[11px]">
              {isEmailVerified ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Email verified</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Unverified email</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {resendingEmail && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                    <span>Resend</span>
                  </button>
                </div>
              )}
            </div>

            {emailSentNotice && (
              <p className="mt-1.5 text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 p-1.5 rounded text-center">
                {emailSentNotice}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-surface-400" />
              <span>Investigation Workspace</span>
            </Link>
            <Link
              href="/cases"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              <User className="h-4 w-4 text-surface-400" />
              <span>My Claims Registry</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="pt-1 border-t border-surface-100 dark:border-surface-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of ClaimScope</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
