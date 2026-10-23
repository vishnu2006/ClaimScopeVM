'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  onIdTokenChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { api, setIdTokenProvider } from '@/lib/api';

export interface UserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  authError: null,
  isConfigured: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => {},
  resendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch or sync the PostgreSQL profile
  const syncBackendProfile = useCallback(async (token: string | null) => {
    if (!token) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await api.getMyProfile();
      setUserProfile(profile);
    } catch (err) {
      console.warn('Syncing ClaimScope user profile error:', err);
    }
  }, []);

  // Hook Firebase auth listener
  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      // Unconfigured Firebase (demo mode or missing keys)
      setIdTokenProvider(null);
      setLoading(false);
      return;
    }

    // Register token supplier with api client
    setIdTokenProvider(async () => {
      if (firebaseAuth.currentUser) {
        return firebaseAuth.currentUser.getIdToken(false);
      }
      return null;
    });

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await syncBackendProfile(token);
        } catch (err) {
          console.warn('Error fetching ID token on change:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [syncBackendProfile]);

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, pass: string) => {
    const firebaseAuth = auth;
    if (!firebaseAuth) throw new Error('Firebase authentication is not configured.');
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
      const token = await cred.user.getIdToken();
      await syncBackendProfile(token);
    } catch (err: any) {
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Sign Up with Email & Password + Display Name
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const firebaseAuth = auth;
    if (!firebaseAuth) throw new Error('Firebase authentication is not configured.');
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
      // Set Firebase display name
      if (displayName && displayName.trim()) {
        await updateProfile(cred.user, {
          displayName: displayName.trim(),
        });
      }
      // Email verification disabled as requested
      // (Account is immediately active upon creation)
      const token = await cred.user.getIdToken(true);
      await syncBackendProfile(token);
    } catch (err: any) {
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth || !googleProvider) throw new Error('Google authentication is not configured.');
    setAuthError(null);
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const token = await cred.user.getIdToken();
      await syncBackendProfile(token);
    } catch (err: any) {
      // User closed popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Password Reset Email
  const sendPasswordReset = async (email: string) => {
    const firebaseAuth = auth;
    if (!firebaseAuth) throw new Error('Firebase authentication is not configured.');
    setAuthError(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
    } catch (err: any) {
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth || !firebaseAuth.currentUser) throw new Error('No signed-in user.');
    setAuthError(null);
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
    } catch (err: any) {
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Update Profile
  const updateUserProfile = async (data: { displayName?: string; photoUrl?: string }) => {
    const firebaseAuth = auth;
    if (!firebaseAuth || !firebaseAuth.currentUser) throw new Error('No signed-in user.');
    setAuthError(null);
    try {
      await updateProfile(firebaseAuth.currentUser, {
        displayName: data.displayName ?? firebaseAuth.currentUser.displayName,
        photoURL: data.photoUrl ?? firebaseAuth.currentUser.photoURL,
      });
      // Also update backend user record
      const updated = await api.updateMyProfile({
        display_name: data.displayName,
        photo_url: data.photoUrl,
      });
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (err: any) {
      const msg = getReadableAuthError(err.code || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Logout
  const logout = async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;
    try {
      await firebaseSignOut(firebaseAuth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        isConfigured: isFirebaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        updateUserProfile,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Convert Firebase auth error codes to clear, professional user-facing messages
function getReadableAuthError(codeOrMsg: string): string {
  switch (codeOrMsg) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'The email address provided is not valid.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your organization administrator.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed login attempts. Please reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network communication failed. Please check your internet connection.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication settings. Add it in Firebase Console -> Auth -> Settings -> Authorized Domains.';
    default:
      if (typeof codeOrMsg === 'string' && codeOrMsg.startsWith('auth/')) {
        return `Authentication notice: ${codeOrMsg.replace('auth/', '').replace(/-/g, ' ')}`;
      }
      return codeOrMsg || 'An unexpected authentication error occurred.';
  }
}
